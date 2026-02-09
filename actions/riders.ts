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
  
  // --- RECOLECCIÓN DE DATOS ---
  const dataToSave = {
    full_name: formData.get('full_name') as string,
    category: formData.get('category') as string,
    club: formData.get('club') as string || null,
    instagram: formData.get('instagram') as string || null,
    birth_date: (formData.get('birth_date') as string) || '2000-01-01',
    
    // CORRECCIÓN: Usamos 'ciudad' para que coincida con la base de datos
    ciudad: formData.get('ciudad') as string 
  };

  // Validación
  if (!dataToSave.ciudad) {
      return { 
        message: 'La ciudad es obligatoria.', 
        success: false,
        timestamp: Date.now()
      };
  }

  let error;

  try {
    if (id) {
      // UPDATE
      const response = await supabase.from('riders').update(dataToSave).eq('id', id);
      error = response.error;
    } else {
      // INSERT
      const response = await supabase.from('riders').insert(dataToSave);
      error = response.error;
    }

    if (error) {
      console.error('Error DB:', error);
      
      if (error.code === '23505') {
        return { 
          message: 'Error: Ya existe un corredor con ese Nombre.', 
          success: false,
          timestamp: Date.now()
        };
      }

      return { 
        message: 'Error al guardar: ' + error.message, 
        success: false,
        timestamp: Date.now()
      };
    }

  } catch (e) {
    return { 
      message: 'Ocurrió un error inesperado en el servidor.', 
      success: false,
      timestamp: Date.now()
    };
  }

  revalidatePath('/admin');
  revalidatePath('/ranking');
  redirect('/admin');
}

export async function deleteRider(id: string): Promise<RiderState> {
  if (!id) return { success: false, message: 'ID no válido' };

  try {
    const { error } = await supabase.from('riders').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return {
          message: 'No se puede eliminar: Este corredor tiene historial. Borra sus resultados primero.',
          success: false,
          timestamp: Date.now()
        };
      }
      return { message: error.message, success: false, timestamp: Date.now() };
    }
  } catch (e) {
    return { message: 'Error inesperado.', success: false, timestamp: Date.now() };
  }

  revalidatePath('/admin');
  redirect('/admin');
}