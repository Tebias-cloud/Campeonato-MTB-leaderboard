'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { formatChileanPhone, cleanInstagramHandle } from '@/lib/utils';

export type RiderState = {
  message?: string | null;
  success?: boolean;
  timestamp?: number;
};

export async function saveRider(prevState: RiderState, formData: FormData): Promise<RiderState> {
  const id = formData.get('id') as string;
  
  // --- 1. LÓGICA DE CLUB SIMPLIFICADA ---
  // Obtenemos el valor directamente del campo 'club' (ya sea del select o del input manual)
  const rawClub = (formData.get('club') as string)?.trim() || 'INDEPENDIENTE / LIBRE';
  const finalClub = rawClub.toUpperCase();

  // Si el club es nuevo, intentamos registrarlo en la tabla maestra 'clubs'
  if (finalClub !== 'INDEPENDIENTE / LIBRE') {
    // El insert fallará silenciosamente si ya existe por el UNIQUE del nombre, lo cual es correcto
    await supabase.from('clubs').insert({ name: finalClub });
  }

  // --- 2. PREPARAR DATOS DEL RIDER ---
  const dataToSave = {
    full_name: (formData.get('full_name') as string)?.toUpperCase(),
    rut: formData.get('rut') as string,
    category: formData.get('category') as string,
    club: finalClub, 
    ciudad: (formData.get('ciudad') as string)?.toUpperCase(),
    email: (formData.get('email') as string)?.toLowerCase() || null,
    phone: formatChileanPhone(formData.get('phone') as string), 
    instagram: cleanInstagramHandle(formData.get('instagram') as string),
    birth_date: (formData.get('birth_date') as string) || null,
  };

  // Validaciones
  if (!dataToSave.full_name) return { message: 'El nombre es obligatorio.', success: false, timestamp: Date.now() };
  if (!dataToSave.rut) return { message: 'El RUT es obligatorio.', success: false, timestamp: Date.now() };

  try {
    let error;
    if (id) {
      // ACTUALIZAR
      const { error: updateError } = await supabase.from('riders').update(dataToSave).eq('id', id);
      error = updateError;

      // ✅ SINCRONIZAR CATEGORÍA Y CLUB EN PARTICIPACIONES ACTIVAS
      // Si actualizamos el perfil, queremos que sus inscripciones actuales reflejen el cambio
      if (!error) {
        await supabase.from('event_riders')
          .update({ 
            category_at_event: dataToSave.category,
            club_at_event: dataToSave.club 
          })
          .eq('rider_id', id);
      }
    } else {
      // INSERTAR
      const { data: newRider, error: insertError } = await supabase
        .from('riders')
        .insert(dataToSave)
        .select('id')
        .single();
        
      error = insertError;

      // ✅ AUTO-REGISTRAR AL PRÓXIMO EVENTO (Para que no quede "en el aire")
      if (!error && newRider) {
        const { data: upcomingEvent } = await supabase
          .from('events')
          .select('id')
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (upcomingEvent) {
          await supabase.from('event_riders').insert({
            event_id: upcomingEvent.id,
            rider_id: newRider.id,
            category_at_event: dataToSave.category,
            club_at_event: dataToSave.club
          });
        }
      }
    }

    if (error) {
      console.error('Error DB Rider:', error);
      if (error.code === '23505') {
        return { 
          message: 'Error: El RUT ' + dataToSave.rut + ' ya está registrado con otro corredor.', 
          success: false, 
          timestamp: Date.now() 
        };
      }
      return { message: 'Error de Database: ' + error.message, success: false, timestamp: Date.now() };
    }

  } catch (e: any) {
    console.error('Error Crítico saveRider:', e);
    return { message: 'Error de servidor: ' + (e.message || 'Desconocido'), success: false, timestamp: Date.now() };
  }

  // Limpiar caché para que los cambios se vean al instante
  revalidatePath('/admin/riders');
  revalidatePath('/ranking');
  revalidatePath('/'); 
  
  // Redirigir fuera del try/catch
  redirect('/admin/riders');
}

// --- FUNCIÓN PARA ELIMINAR CON LIMPIEZA PROFUNDA ---
export async function deleteRider(id: string) {
  let isDeleted = false;
  try {
    // 1. Limpiar participaciones en eventos
    await supabase.from('event_riders').delete().eq('rider_id', id);
    
    // 2. Limpiar resultados históricos
    await supabase.from('results').delete().eq('rider_id', id);

    // 3. Finalmente borrar al corredor
    const { error } = await supabase.from('riders').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando corredor:', error);
      return { message: 'Error al eliminar el perfil principal.', success: false };
    }

    revalidatePath('/admin/riders');
    revalidatePath('/ranking');
    revalidatePath('/');
    isDeleted = true;
    
  } catch (error) {
    console.error('Error inesperado en deleteRider:', error);
    return { message: 'Error de integridad en la base de datos.', success: false };
  }
  
  if (isDeleted) {
    redirect('/admin/riders');
  }
}