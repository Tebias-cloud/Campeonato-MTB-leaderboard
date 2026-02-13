'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
    phone: formData.get('phone') as string || null,
    instagram: formData.get('instagram') as string || null,
    birth_date: (formData.get('birth_date') as string) || null,
  };

  // Validaciones
  if (!dataToSave.full_name) return { message: 'El nombre es obligatorio.', success: false, timestamp: Date.now() };
  if (!dataToSave.rut) return { message: 'El RUT es obligatorio.', success: false, timestamp: Date.now() };

  try {
    let error;
    if (id) {
      // ACTUALIZAR
      const response = await supabase.from('riders').update(dataToSave).eq('id', id);
      error = response.error;
    } else {
      // INSERTAR
      const response = await supabase.from('riders').insert(dataToSave);
      error = response.error;
    }

    if (error) {
      console.error('Error DB:', error);
      if (error.code === '23505') {
        return { message: 'Error: Ya existe un corredor con ese RUT.', success: false, timestamp: Date.now() };
      }
      return { message: 'Error al guardar: ' + error.message, success: false, timestamp: Date.now() };
    }

  } catch (e) {
    return { message: 'Error inesperado en el servidor.', success: false, timestamp: Date.now() };
  }

  // Limpiar caché para que los cambios se vean al instante
  revalidatePath('/admin/riders');
  revalidatePath('/ranking');
  revalidatePath('/'); 
  
  // Redirigir fuera del try/catch
  redirect('/admin/riders');
}

// --- FUNCIÓN PARA ELIMINAR ---
export async function deleteRider(id: string) {
  let isDeleted = false;
  try {
    const { error } = await supabase.from('riders').delete().eq('id', id);

    if (error) {
      console.error('Error eliminando:', error);
      return { message: 'Error al eliminar.', success: false };
    }

    revalidatePath('/admin/riders');
    revalidatePath('/ranking');
    revalidatePath('/');
    isDeleted = true;
    
  } catch (error) {
    return { message: 'Error inesperado.', success: false };
  }
  
  if (isDeleted) {
    redirect('/admin/riders');
  }
}