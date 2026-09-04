'use server';

import { supabase } from '@/lib/supabase';
import { revalidatePath } from 'next/cache';
import { normalizeCategory } from '@/lib/utils';

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

  // Normalizar la categoría antes de guardar
  const normalizedData = {
    ...data,
    category_played: normalizeCategory(data.category_played)
  };

  // Upsert busca coincidencias en (event_id, rider_id).
  // Si existe, actualiza. Si no, crea.
  const { error } = await supabase
    .from('results')
    .upsert(normalizedData, { 
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

export async function bulkCreateResults(dataArray: CreateResultData[]) {
  console.log(`--- GUARDANDO BATCH DE ${dataArray.length} RESULTADOS ---`);

  const normalizedDataArray = dataArray.map(data => ({
    ...data,
    category_played: normalizeCategory(data.category_played)
  }));

  const { error } = await supabase
    .from('results')
    .upsert(normalizedDataArray, { 
      onConflict: 'event_id, rider_id',
      ignoreDuplicates: false 
    });

  if (error) {
    console.error('Error DB:', error);
    throw new Error('Error al guardar batch: ' + error.message);
  }

  // Refrescamos las vistas una sola vez por lote
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