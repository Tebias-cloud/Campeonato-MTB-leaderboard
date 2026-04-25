'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';
import { sendEmail, getApprovalEmailHtml } from '@/lib/email-service';

// Definición estricta de tipos para TypeScript
export interface RegistrationRequest {
  id: string;
  created_at: string;
  full_name: string;
  rut: string;
  email: string;
  phone: string;
  club: string | null;
  ciudad: string;
  category: string;
  birth_date: string;
  instagram: string | null;
  status: string;
  terms_accepted: boolean; 
  event_id?: string; // FK al evento a inscribir
}

// Obtener solo las solicitudes pendientes
export async function getPendingRequests(): Promise<RegistrationRequest[]> {
  const { data, error } = await supabase
    .from('registration_requests')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching requests:', error);
    return [];
  }
  return data as RegistrationRequest[];
}

import { normalizeCategory } from '@/lib/utils';

// ... (existing interfaces)

// Función principal de Aprobación Mejorada (Ahora acepta TODOS los campos)
export async function approveRequest(
  requestId: string, 
  overrides?: { 
    full_name?: string, 
    email?: string, 
    rut?: string, 
    birth_date?: string, 
    club?: string, 
    category?: string, 
    phone?: string, 
    instagram?: string,
    ciudad?: string 
  }
) {
  try {
    // 1. Buscar la solicitud original
    const { data: request, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError || !request) {
      console.error('ERROR AL BUSCAR SOLICITUD:', fetchError);
      return { success: false, message: 'Solicitud no encontrada o error de base de datos.' };
    }

    // 2. Determinar los valores finales y Normalizar
    const finalRut = (overrides?.rut || request.rut)?.trim().toUpperCase();
    const finalFullName = (overrides?.full_name || request.full_name)?.trim().toUpperCase();
    const finalEmail = (overrides?.email || request.email)?.toLowerCase().trim();
    const finalBirthDate = overrides?.birth_date || request.birth_date;
    const finalClub = (overrides?.club || request.club || 'INDEPENDIENTE / LIBRE').trim().toUpperCase();
    const finalCiudad = (overrides?.ciudad || request.ciudad || 'IQUIQUE').trim().toUpperCase() || 'IQUIQUE';
    
    // Normalizar Categoría para evitar inconsistencias de nombres largos o viejos
    const rawCategory = overrides?.category || request.category || 'Novicios Varones';
    const finalCategory = normalizeCategory(rawCategory);

    // 2.5. Asegurar existencia del Club
    if (finalClub !== 'INDEPENDIENTE / LIBRE') {
      await supabase.from('clubs').upsert({ name: finalClub }, { onConflict: 'name' });
    }

    // 3. UPSERT Rider
    const { data: riderData, error: upsertError } = await supabase
      .from('riders')
      .upsert({
        rut: finalRut,
        full_name: finalFullName,
        email: finalEmail,
        birth_date: finalBirthDate,
        ciudad: finalCiudad,
        category: finalCategory,
        club: finalClub,
        phone: overrides?.phone || request.phone,
        instagram: overrides?.instagram || request.instagram,
      }, { 
        onConflict: 'rut' 
      })
      .select('id')
      .single();

    if (upsertError || !riderData) {
      console.error('ERROR UPSERT RIDER:', upsertError);
      return { success: false, message: `Error al registrar corredor: ${upsertError?.message}` };
    }

    const riderId = riderData.id;

    // 3.5. DETERMINAR EVENT_ID
    let finalEventId = request.event_id;
    if (!finalEventId) {
      const { data: upcomingEvent } = await supabase
        .from('events')
        .select('id')
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .limit(1)
        .maybeSingle();
      finalEventId = upcomingEvent?.id;
    }

    if (!finalEventId) {
      return { success: false, message: 'No se pudo determinar el evento para la inscripción.' };
    }

    // 3.6. Insertar en event_riders (Competición)
    const { error: eventRiderError } = await supabase
      .from('event_riders')
      .upsert({
        event_id: finalEventId,
        rider_id: riderId,
        category_at_event: finalCategory,
        club_at_event: finalClub,
      }, {
        onConflict: 'event_id,rider_id'
      });

    if (eventRiderError) {
      console.error('ERROR EVENT_RIDERS:', eventRiderError);
      return { success: false, message: `Error al inscribir en el evento: ${eventRiderError.message}` };
    }

    // 3.7. Insertar en registrations (Respaldo)
    const { error: insertRegistrationError } = await supabase
      .from('registrations')
      .upsert({
        event_id: finalEventId,
        rut: finalRut,
        full_name: finalFullName,
        email: finalEmail || 'sin@correo.cl',
        category_selected: finalCategory,
        status: 'approved'
      }, {
        onConflict: 'event_id,rut'
      });

    if (insertRegistrationError) {
      console.error('ERROR REGISTRATIONS:', insertRegistrationError);
      // No bloqueamos aquí porque ya está en event_riders, pero avisamos en consola
    }

    // 4. SOLO SI TODO LO ANTERIOR FUNCIONÓ, BORRAMOS LA SOLICITUD
    const { error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId);

    if (deleteError) {
      console.error('ERROR AL ELIMINAR SOLICITUD:', deleteError);
      // Ojo: Aquí el rider ya está creado, pero la solicitud sigue ahí.
      // Podría causar que el admin intente aprobarla de nuevo.
    }

    // 5. ENVIAR CORREO DE APROBACIÓN (Background task)
    const { data: eventInfo } = await supabase.from('events').select('name').eq('id', finalEventId).single();
    if (eventInfo && finalEmail) {
      const html = getApprovalEmailHtml(finalFullName, eventInfo.name, (overrides?.category || request.category));
      
      // No bloqueamos el retorno por el envío de email, pero intentamos enviarlo
      sendEmail({
        to: finalEmail,
        subject: `¡Inscripción Confirmada! - ${eventInfo.name}`,
        html
      }).catch(e => console.error('Error enviando correo de aprobación:', e));
    }
    
    // 6. Revalidar todas las rutas afectadas (Next.js Cache)
    revalidatePath('/admin');
    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin/riders');
    revalidatePath('/ranking'); 
    revalidatePath('/');
    
    return { success: true, message: 'Rider aprobado, participación registrada y correo enviado.' };

  } catch (error) {
    console.error('Error crítico en approveRequest:', error);
    return { success: false, message: 'Error inesperado en el servidor.' };
  }
}

// Función para Eliminar/Rechazar solicitud
export async function rejectRequest(requestId: string) {
  try {
    const { error } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId);

    if (error) throw error;

    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin');
    
    return { success: true, message: 'Solicitud eliminada.' };
  } catch (error) {
    console.error('Error en rejectRequest:', error);
    return { success: false, message: 'Error al borrar la solicitud.' };
  }
}