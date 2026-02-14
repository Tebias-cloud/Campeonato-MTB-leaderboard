'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

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

    // 3. Lógica UPSERT: Si el RUT existe, actualiza; si no, inserta.
    const { error: upsertError } = await supabase
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
      });

    if (upsertError) {
      console.error('Error en UPSERT Rider:', upsertError);
      return { success: false, message: 'Error al registrar al corredor.' };
    }

    // 4. Limpiar la solicitud: La borramos físicamente de las pendientes
    const { error: deleteError } = await supabase
        .from('registration_requests')
        .delete()
        .eq('id', requestId);

    if (deleteError) {
      console.error('Error al eliminar solicitud aprobada:', deleteError);
    }
    
    // 5. Revalidar todas las rutas afectadas
    revalidatePath('/admin');
    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin/riders');
    revalidatePath('/ranking'); 
    revalidatePath('/');
    
    return { success: true, message: 'Rider aprobado y ranking actualizado.' };

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