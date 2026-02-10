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
  
  // 1. OBTENER Y PROCESAR EL CLUB
  const clubMode = formData.get('club_mode') as string;
  let finalClub: string | null = null;

  try {
      if (clubMode === 'existing') {
          // Si eligió de la lista
          finalClub = formData.get('selected_club') as string;
      } 
      else if (clubMode === 'new') {
          // Si escribió uno nuevo
          const newName = (formData.get('new_club_name') as string)?.trim();
          if (newName) {
              // A. Guardarlo en la tabla 'clubs' primero para el futuro
              // Usamos .select() para confirmar que funcionó, ignoramos si ya existe (error 23505 lo manejaría postgres si configuramos ON CONFLICT, pero aquí un simple insert está bien)
              const { error: clubError } = await supabase.from('clubs').insert({ name: newName }).select();
              
              // Si falla porque ya existe, no importa, lo usamos igual. Si es otro error, lo logueamos.
              if (clubError && clubError.code !== '23505') {
                  console.error('Error creando club:', clubError);
              }
              finalClub = newName;
          }
      }
      // Si clubMode es 'none', finalClub se queda en null
  } catch (error) {
      console.error('Error procesando club', error);
      return { message: 'Error procesando el club', success: false, timestamp: Date.now() };
  }

  // 2. PREPARAR DATOS FINALES
  const dataToSave = {
    full_name: formData.get('full_name') as string,
    rut: formData.get('rut') as string, // Guardamos el RUT
    category: formData.get('category') as string,
    club: finalClub, // Usamos el club procesado arriba
    instagram: formData.get('instagram') as string || null,
    birth_date: (formData.get('birth_date') as string) || '2000-01-01',
    ciudad: formData.get('ciudad') as string 
  };

  // Validaciones básicas
  if (!dataToSave.ciudad) return { message: 'La ciudad es obligatoria.', success: false, timestamp: Date.now() };
  if (!dataToSave.rut) return { message: 'El RUT es obligatorio.', success: false, timestamp: Date.now() };

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
      
      // Capturamos el error de RUT DUPLICADO (Código Postgres 23505)
      if (error.code === '23505') {
        // Verificamos si el error viene del campo RUT
        if (error.message?.includes('rut') || error.details?.includes('rut')) {
             return { message: 'Error: Ya existe un corredor con ese RUT.', success: false, timestamp: Date.now() };
        }
        // Si no es el RUT, asumimos que puede ser el nombre u otro campo único
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

  revalidatePath('/admin');
  revalidatePath('/ranking');
  revalidatePath('/'); // Actualizar home por si salen los riders destacados
  
  // Si todo sale bien, redirigimos
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
  revalidatePath('/ranking');
  redirect('/admin');
}