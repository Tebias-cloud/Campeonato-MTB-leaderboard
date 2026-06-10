'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

export async function updateLiveResults(eventId: string, liveResultsJson: any) {
  const { error } = await supabase
    .from('events')
    .update({ live_results_json: liveResultsJson })
    .eq('id', eventId);

  if (error) {
    throw new Error('Error guardando live results: ' + error.message);
  }

  // Refrescar vistas para que los clientes obtengan la data fresca
  revalidatePath('/admin');
  revalidatePath('/');
}
