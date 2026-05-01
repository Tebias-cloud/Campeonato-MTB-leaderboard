'use server';

import { supabaseAdmin as supabase } from '@/lib/supabase-admin';

export async function getDorsalPreview(eventId: string, category: string, startNumber: number) {
  try {
    const [takenRes, participantsRes] = await Promise.all([
      supabase.from('event_riders').select('dorsal, rider_id').eq('event_id', eventId).not('dorsal', 'is', null),
      supabase.from('event_riders').select('rider_id, dorsal').eq('event_id', eventId).eq('category_at_event', category).order('created_at', { ascending: true }),
    ]);

    if (takenRes.error) throw takenRes.error;
    if (participantsRes.error) throw participantsRes.error;

    // 2. Obtener nombres de riders por separado para evitar errores de join
    const riderIds = (participantsRes.data || []).map(p => p.rider_id);
    const { data: ridersData } = riderIds.length > 0 
      ? await supabase.from('riders').select('id, full_name').in('id', riderIds)
      : { data: [] };
    
    const ridersMap = new Map((ridersData || []).map(r => [r.id, r.full_name]));

    const taken = new Set((takenRes.data || []).map((d: any) => d.dorsal.toString()));
    const sorted = [...(participantsRes.data || [])].sort((a: any, b: any) =>
      (ridersMap.get(a.rider_id) || '').localeCompare(ridersMap.get(b.rider_id) || '')
    );

    let current = startNumber;
    const result = sorted.map((p: any) => {
      const ownerId = (takenRes.data || []).find((te: any) => te.dorsal?.toString() === current.toString())?.rider_id;
      let skipped = false;
      while (taken.has(current.toString()) && ownerId !== p.rider_id) { 
        current++; 
        skipped = true; 
      }
      const assigned = current;
      taken.add(current.toString());
      current++;
      return { name: ridersMap.get(p.rider_id) || '?', dorsal: assigned, skipped };
    });

    return { success: true, preview: result };
  } catch (error: any) {
    console.error('Error in getDorsalPreview:', error);
    return { success: false, message: error.message };
  }
}
