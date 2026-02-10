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
  
  // --- 1. LÓGICA INTELIGENTE DE CLUBES ---
  const clubMode = formData.get('club_mode') as string;
  let finalClub: string | null = null;

  // Debug para ver qué llega
  // console.log("Modo Club:", clubMode); 

  if (clubMode === 'existing') {
      // Si eligió de la lista desplegable
      finalClub = formData.get('selected_club') as string;
      if (!finalClub || finalClub === "") finalClub = null;
  } 
  else if (clubMode === 'new') {
      // Si escribió un nombre nuevo
      const rawName = (formData.get('new_club_name') as string)?.trim();
      
      if (rawName) {
          // Intentamos guardar el club en la base de datos maestra 'clubs'
          // Usamos .select() para confirmar la operación
          const { error: clubError } = await supabase
            .from('clubs')
            .insert({ name: rawName })
            .select();

          // Si falla, verificamos por qué. 
          // Si es error 23505 (duplicado), no importa, usamos el nombre igual.
          if (clubError && clubError.code !== '23505') {
              console.error('Error guardando club nuevo:', clubError);
          }
          
          finalClub = rawName;
      }
  }
  // Si clubMode es 'none', finalClub se queda en null

  // --- 2. PREPARAR DATOS DEL RIDER ---
  const dataToSave = {
    full_name: formData.get('full_name') as string,
    rut: formData.get('rut') as string, // Guardamos el RUT
    category: formData.get('category') as string,
    club: finalClub, // Usamos el club procesado arriba
    instagram: formData.get('instagram') as string || null,
    birth_date: (formData.get('birth_date') as string) || null,
    ciudad: formData.get('ciudad') as string 
  };

  // Validaciones básicas
  if (!dataToSave.full_name) return { message: 'El nombre es obligatorio.', success: false, timestamp: Date.now() };
  if (!dataToSave.rut) return { message: 'El RUT es obligatorio.', success: false, timestamp: Date.now() };
  if (!dataToSave.ciudad) return { message: 'La ciudad es obligatoria.', success: false, timestamp: Date.now() };

  let error;

  try {
    if (id) {
      // MODO EDICIÓN (UPDATE)
      const response = await supabase.from('riders').update(dataToSave).eq('id', id);
      error = response.error;
    } else {
      // MODO CREACIÓN (INSERT)
      const response = await supabase.from('riders').insert(dataToSave);
      error = response.error;
    }

    if (error) {
      console.error('Error DB:', error);
      
      // Manejo de errores específicos
      if (error.code === '23505') {
        // Error de duplicado (Unique Constraint)
        if (error.message?.includes('rut') || error.details?.includes('rut')) {
             return { message: 'Error: Ya existe un corredor con ese RUT.', success: false, timestamp: Date.now() };
        }
        return { message: 'Error: Datos duplicados (posiblemente RUT o Nombre).', success: false, timestamp: Date.now() };
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

  // Revalidar caché para que se actualicen las listas
  revalidatePath('/admin/riders');
  revalidatePath('/ranking');
  revalidatePath('/'); 
  
  // Redirigir a la lista
  redirect('/admin/riders');
}

export async function deleteRider(id: string): Promise<RiderState> {
  if (!id) return { success: false, message: 'ID no válido' };

  try {
    const { error } = await supabase.from('riders').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return {
          message: 'No se puede eliminar: Este corredor tiene resultados asociados. Borra sus resultados primero.',
          success: false,
          timestamp: Date.now()
        };
      }
      return { message: error.message, success: false, timestamp: Date.now() };
    }
  } catch (e) {
    return { message: 'Error inesperado.', success: false, timestamp: Date.now() };
  }

  revalidatePath('/admin/riders');
  redirect('/admin/riders');
}