'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// 1. Actualizamos la interfaz para incluir los nuevos campos opcionales
interface CreateResultData {
  event_id: string;
  rider_id: string;
  position: number;
  points: number;
  category_played: string;
  race_time?: string | null; // Nuevo: Tiempo ("HH:MM:SS")
  avg_speed?: number | null; // Nuevo: Velocidad Promedio
}

export async function createResult(data: CreateResultData) {
  console.log("--- INTENTANDO GUARDAR RESULTADO (MODO UPSERT) ---", data);

  // USAMOS UPSERT: Si existe la combinación (event_id, rider_id), actualiza. Si no, crea.
  // Al pasar 'data' completo, Supabase guardará automáticamente race_time y avg_speed
  const { error } = await supabase
    .from('results')
    .upsert(data, { 
      onConflict: 'event_id, rider_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('❌ Error fatal en base de datos:', error);
    throw new Error('Error al guardar: ' + error.message);
  }

  console.log("✅ Resultado guardado/actualizado con éxito");

  // Actualizamos todas las vistas relevantes
  revalidatePath('/admin/results');
  revalidatePath('/ranking');
  revalidatePath('/');
  revalidatePath(`/profile/${data.rider_id}`); // Importante: refrescar el perfil del rider modificado
}

export async function deleteResult(resultId: string) {
  const { error } = await supabase
    .from('results')
    .delete()
    .eq('id', resultId);

  if (error) {
    console.error('Error borrando resultado:', error);
    throw new Error('No se pudo borrar el resultado');
  }

  revalidatePath('/admin/results');
  revalidatePath('/ranking');
  revalidatePath('/');
}