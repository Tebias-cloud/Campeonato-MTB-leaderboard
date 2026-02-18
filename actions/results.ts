'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';

// Definimos los tipos exactos
interface CreateResultData {
  event_id: string;
  rider_id: string;
  category_played: string; // "Novicios", "Elite", etc.
  position: number;
  points: number;
  race_time?: string | null;
  avg_speed?: number | null;
}

export async function createResult(data: CreateResultData) {
  console.log("--- GUARDANDO ---", data);

  // Upsert busca coincidencias en (event_id, rider_id).
  // Si existe, actualiza. Si no, crea.
  const { error } = await supabase
    .from('results')
    .upsert(data, { 
      onConflict: 'event_id, rider_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error DB:', error);
    throw new Error('Error al guardar: ' + error.message);
  }

  // Refrescamos las vistas
  revalidatePath('/admin/results');
  revalidatePath('/ranking'); 
  revalidatePath('/');
}

export async function deleteResult(resultId: string) {
  const { error } = await supabase.from('results').delete().eq('id', resultId);
  if (error) throw new Error('Error al borrar');
  revalidatePath('/admin/results');
  revalidatePath('/ranking');
}