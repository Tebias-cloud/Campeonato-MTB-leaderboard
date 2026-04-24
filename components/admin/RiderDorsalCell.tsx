'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  riderId: string;
  eventId: string;
  initialDorsal: number | null;
}

export default function RiderDorsalCell({ riderId, eventId, initialDorsal }: Props) {
  const [dorsal, setDorsal] = useState<string>(initialDorsal?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(initialDorsal?.toString() || null);

  const saveDorsal = async () => {
    if (dorsal === lastSaved) return;
    
    setIsSaving(true);
    try {
      if (dorsal === '') {
        // Eliminar si se deja vacío
        await supabase
          .from('event_riders')
          .delete()
          .eq('event_id', eventId)
          .eq('rider_id', riderId);
      } else {
        const dorsalNum = parseInt(dorsal);
        if (isNaN(dorsalNum)) return;

        // Upsert dorsal
        const { error } = await supabase
          .from('event_riders')
          .upsert({
            event_id: eventId,
            rider_id: riderId,
            dorsal: dorsalNum
          }, { 
            onConflict: 'event_id,rider_id' 
          });

        if (error) {
            if (error.code === '23505') alert('Este dorsal ya está ocupado por otro corredor en este evento.');
            else console.error(error);
            setDorsal(lastSaved || '');
        } else {
            setLastSaved(dorsal);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        inputMode="numeric"
        value={dorsal}
        onChange={(e) => setDorsal(e.target.value.replace(/\D/g, ''))}
        onBlur={saveDorsal}
        onKeyDown={(e) => e.key === 'Enter' && saveDorsal()}
        placeholder="---"
        className={`w-16 px-2 py-1 text-center font-mono font-bold text-sm bg-slate-50 border-2 rounded-lg outline-none transition-all ${
          isSaving ? 'border-orange-200 opacity-50' : 
          dorsal !== lastSaved ? 'border-amber-400 bg-amber-50' : 
          'border-slate-100 focus:border-[#C64928] focus:bg-white'
        }`}
      />
      {isSaving && (
        <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
      )}
    </div>
  );
}
