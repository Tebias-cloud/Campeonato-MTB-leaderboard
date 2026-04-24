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
    instagram?: string 
  }
) {
  try {
    // 1. Buscar la solicitud original usando maybeSingle para ser más flexible
    const { data: request, error: fetchError } = await supabase
      .from('registration_requests')
      .select('*')
      .eq('id', requestId)
      .maybeSingle();

    if (fetchError) {
      console.error('FALLO BUSQUEDA SUPABASE:', fetchError);
      return { success: false, message: 'Error de conexión con la base de datos.' };
    }

    if (!request) {
      console.warn(`Solicitud con ID ${requestId} no encontrada en la DB.`);
      return { success: false, message: 'Solicitud no encontrada o ya procesada.' };
    }

    // 2. Determinar los valores finales (Fusionar originales con las ediciones del Admin) y Normalizar
    const finalRut = (overrides?.rut || request.rut).trim().toUpperCase();
    const finalFullName = (overrides?.full_name || request.full_name).trim().toUpperCase();
    const finalEmail = (overrides?.email || request.email)?.toLowerCase().trim();
    const finalBirthDate = overrides?.birth_date || request.birth_date;
    const finalClub = (overrides?.club || request.club || 'INDEPENDIENTE / LIBRE').trim().toUpperCase();
    const finalCiudad = (request.ciudad || 'IQUIQUE').trim().toUpperCase();

    // 2.5. TAREA: Si el club es nuevo, agregarlo a la lista oficial
    if (finalClub !== 'INDEPENDIENTE / LIBRE') {
      // El upsert fallará silenciosamente si ya existe por el UNIQUE del nombre
      await supabase.from('clubs').upsert({ name: finalClub }, { onConflict: 'name' });
    }

    // 3. Lógica UPSERT: Si el RUT existe, actualiza; si no, inserta.
    // Usamos .select('id') para obtener el ID generado u original para vincular con event_riders
    const { data: riderData, error: upsertError } = await supabase
      .from('riders')
      .upsert({
        rut: finalRut,
        full_name: finalFullName,
        email: finalEmail,
        birth_date: finalBirthDate,
        ciudad: finalCiudad,
        category: overrides?.category || request.category,
        club: finalClub,
        phone: overrides?.phone || request.phone,
        instagram: overrides?.instagram || request.instagram,
      }, { 
        onConflict: 'rut' 
      })
      .select('id')
      .single();

    if (upsertError || !riderData) {
      console.error('Error en UPSERT Rider:', upsertError);
      return { success: false, message: 'Error al registrar al corredor.' };
    }

    const riderId = riderData.id;

    // 3.5. DETERMINAR EVENT_ID (Siempre buscamos la fecha más próxima para asegurar inscripción activa)
    let finalEventId = request.event_id;
    
    // Buscamos el evento más cercano (hoy o futuro)
    const { data: upcomingEvent } = await supabase
      .from('events')
      .select('id, date')
      .gte('date', new Date().toISOString().split('T')[0]) // Fecha >= hoy
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (upcomingEvent) {
      // Si no tiene evento o el que tiene es distinto al próximo, usamos el próximo
      if (!finalEventId || finalEventId !== upcomingEvent.id) {
        console.log(`Asignando automáticamente al próximo evento [${upcomingEvent.id}] en lugar de [${finalEventId}]`);
        finalEventId = upcomingEvent.id;
      }
    } else if (!finalEventId) {
       // Si no hay futuros, buscamos el último creado por si acaso
       const { data: lastEvent } = await supabase.from('events').select('id').order('date', { ascending: false }).limit(1).maybeSingle();
       finalEventId = lastEvent?.id;
    }

    // 3.6. Insertar ticket en event_riders (LA VERDADERA PARTICIPACION)
    if (finalEventId) {
      const { error: eventRiderError } = await supabase
        .from('event_riders')
        .upsert({
          event_id: finalEventId,
          rider_id: riderId,
          category_at_event: overrides?.category || request.category,
          club_at_event: finalClub,
        }, {
          onConflict: 'event_id,rider_id'
        });

      if (eventRiderError) {
        console.error('Error al insertar en event_riders:', eventRiderError);
      }

      // También mantenemos registrations para compatibilidad con el sistema de correos/vistas antiguas
      const { error: insertRegistrationError } = await supabase
        .from('registrations')
        .upsert({
          event_id: finalEventId,
          rut: finalRut,
          full_name: finalFullName,
          email: finalEmail || 'sin@correo.cl',
          category_selected: overrides?.category || request.category,
          status: 'approved'
        }, {
          onConflict: 'event_id,rut'
        });

      if (insertRegistrationError) {
        console.error('Error al insertar en registrations:', insertRegistrationError);
      }
    }

    // 4. Limpiar la solicitud: La borramos físicamente de las pendientes
    const { error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId);

    if (deleteError) {
      console.error('Error al eliminar solicitud aprobada:', deleteError);
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