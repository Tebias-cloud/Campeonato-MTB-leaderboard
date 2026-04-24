'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { revalidatePath } from 'next/cache';

/**
 * Asigna dorsales secuencialmente a una categoría, saltando los que ya estén ocupados en el evento.
 */
export async function assignMassiveDorsals(
  eventId: string,
  categoryId: string,
  startNumber: number
) {
  try {
    // 1. Obtener todos los dorsales ya ocupados en el evento (de cualquier categoría)
    const { data: takenEntries } = await supabase
      .from('event_riders')
      .select('dorsal, rider_id')
      .eq('event_id', eventId)
      .not('dorsal', 'is', null);

    const takenSet = new Set(takenEntries?.map(d => d.dorsal.toString()) || []);
    
    // 2. Obtener los participantes de la categoría objetivo con todos sus datos actuales
    const { data: participants, error: fetchError } = await supabase
      .from('event_riders')
      .select('*, riders(full_name)')
      .eq('event_id', eventId)
      .eq('category_at_event', categoryId);

    if (fetchError) throw fetchError;
    if (!participants || participants.length === 0) {
      return { success: false, message: 'No hay corredores inscritos en esta categoría.' };
    }

    // 3. Ordenar alfabéticamente por nombre del corredor
    const sortedParticipants = [...participants].sort((a, b) => 
      (a.riders?.full_name || '').localeCompare(b.riders?.full_name || '')
    );

    let currentDorsal = startNumber;
    const finalUpdates = [];

    for (const p of sortedParticipants) {
      // Buscar el siguiente dorsal disponible que no esté en el set
      // (Si el rider actual ya tenía ese número, permitimos mantenerlo si está libre)
      while (takenSet.has(currentDorsal.toString())) {
        // Verificar si el dueño de ese dorsal es el mismo corredor (para no saltarlo innecesariamente)
        const ownerId = takenEntries?.find(te => te.dorsal.toString() === currentDorsal.toString())?.rider_id;
        if (ownerId === p.rider_id) {
          break; // Es suyo, podemos seguir
        }
        currentDorsal++;
      }

      finalUpdates.push({
        ...p,
        riders: undefined, // Quitamos la relación para el upsert
        dorsal: currentDorsal
      });

      // Registrar como ocupado para el siguiente
      takenSet.add(currentDorsal.toString());
      currentDorsal++;
    }

    // 4. Guardar los cambios
    const { error: updateError } = await supabase
      .from('event_riders')
      .upsert(finalUpdates, { onConflict: 'event_id, rider_id' });

    if (updateError) throw updateError;

    revalidatePath('/admin/riders');
    return { success: true, message: `Se asignaron ${finalUpdates.length} dorsales (empezando desde el ${startNumber}).` };

  } catch (error: any) {
    console.error('Error en assignMassiveDorsals:', error);
    return { success: false, message: error.message || 'Error inesperado.' };
  }
}
