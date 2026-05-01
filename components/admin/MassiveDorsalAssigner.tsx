'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { OFFICIAL_CATEGORIES } from '@/lib/categories';
import { assignMassiveDorsals, clearEventDorsals } from '@/actions/dorsals';
import { getDorsalPreview } from '@/actions/dorsal-preview';
import { supabase } from '@/lib/supabase';

interface Props { eventId: string; }

export default function MassiveDorsalAssigner({ eventId }: Props) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(OFFICIAL_CATEGORIES[0].id);
  const [startNum, setStartNum] = useState(100);
  const [debouncedStart, setDebouncedStart] = useState(100); // solo cambia después de parar de escribir
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<{ name: string; dorsal: number; skipped: boolean }[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce: solo actualiza debouncedStart 600ms después del último cambio
  const handleStartChange = (val: number) => {
    const safe = Math.max(1, val);
    setStartNum(safe);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedStart(safe), 600);
  };

  // Fetch solo cuando cambia categoría o debouncedStart (no en cada tecla)
  useEffect(() => {
    if (!isOpen) return;
    setLoadingPreview(true);
    getDorsalPreview(eventId, category, debouncedStart).then(res => {
      if (res.success && res.preview) {
        setPreview(res.preview);
      } else {
        console.error('Error fetching preview:', res.message);
      }
    }).catch(err => {
      console.error('Fetch error:', err);
    }).finally(() => {
      setLoadingPreview(false);
    });
  }, [isOpen, category, eventId, debouncedStart]);

  const handleAssign = async () => {
    if (preview.length === 0) return;
    if (!confirm(`¿Asignar dorsales a ${preview.length} corredor(es) de "${category}" empezando desde el ${debouncedStart}?`)) return;
    setLoading(true);
    const result = await assignMassiveDorsals(eventId, category, debouncedStart);
    setLoading(false);
    if (result.success) {
      setIsOpen(false);
      // window.location.reload es más fiable que router.refresh() con force-dynamic
      window.location.reload();
    } else {
      alert('Error: ' + result.message);
    }
  };

  if (!mounted) {
    return (
      <div className="bg-white/5 px-4 py-3 rounded-2xl text-[10px] border border-white/10 w-40 h-10 animate-pulse" />
    );
  }

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)}
        className="bg-white/10 hover:bg-white/20 text-[#EFE6D5] px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 hover:border-white/40 transition-all flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
        Asignación en Bloque
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-end sm:items-center justify-center sm:p-4 backdrop-blur-sm">
      <div className="bg-[#1A1816] w-full sm:max-w-sm rounded-t-3xl sm:rounded-2xl shadow-2xl border border-white/10 flex flex-col max-h-[85vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
          <p className="text-white font-black text-sm uppercase tracking-tight">Asignar Dorsales en Bloque</p>
          <button onClick={() => setIsOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white font-black flex items-center justify-center transition-colors flex-shrink-0">✕</button>
        </div>

        {/* Controles fijos */}
        <div className="px-5 pt-4 pb-3 space-y-3 flex-shrink-0">
          {/* Categoría */}
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full p-3 rounded-xl bg-white/5 text-white border border-white/15 font-bold text-sm outline-none focus:border-[#C64928] transition-colors cursor-pointer"
          >
            {OFFICIAL_CATEGORIES.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-[#1A1816]">{cat.label}</option>
            ))}
          </select>

          {/* Número inicial — layout fijo sin overflow */}
          <div className="flex items-center gap-2 w-full">
            <button type="button"
              onClick={() => handleStartChange(startNum - 1)}
              className="h-11 w-11 min-w-[2.75rem] bg-white/5 hover:bg-white/15 text-white rounded-xl font-black text-xl transition-colors border border-white/10 flex items-center justify-center">
              −
            </button>
            <input
              type="number" value={startNum}
              onChange={(e) => handleStartChange(parseInt(e.target.value) || 1)}
              className="min-w-0 flex-1 py-2.5 rounded-xl bg-white/5 text-white border border-white/15 font-mono font-black text-2xl text-center outline-none focus:border-[#C64928]"
            />
            <button type="button"
              onClick={() => handleStartChange(startNum + 1)}
              className="h-11 w-11 min-w-[2.75rem] bg-white/5 hover:bg-white/15 text-white rounded-xl font-black text-xl transition-colors border border-white/10 flex items-center justify-center">
              +
            </button>
          </div>
        </div>

        {/* Preview scrolleable */}
        <div className="flex-1 flex flex-col min-h-0 px-5 pb-3">
          <div className="flex items-center justify-between mb-2 flex-shrink-0">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {loadingPreview ? 'Actualizando...' : preview.length === 0 ? 'Sin corredores' : `${preview.length} corredor(es)`}
            </p>
            {preview.length > 1 && !loadingPreview && (
              <p className="text-[10px] text-slate-600 font-bold">{preview[0].dorsal} → {preview[preview.length - 1].dorsal}</p>
            )}
          </div>

          <div
            className="flex-1 overflow-y-auto min-h-0 rounded-xl"
            style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.15) transparent' }}
          >
            {loadingPreview ? (
              <div className="space-y-1.5 p-1">
                {[1,2,3,4].map(i => <div key={i} className="h-8 bg-white/5 rounded-lg animate-pulse" />)}
              </div>
            ) : preview.length === 0 ? (
              <div className="h-24 flex items-center justify-center">
                <p className="text-slate-600 text-xs font-bold text-center">No hay corredores inscritos<br/>en esta categoría</p>
              </div>
            ) : (
              <div className="space-y-1 pr-1">
                {preview.map((r, i) => (
                  <div key={i} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${r.skipped ? 'bg-amber-500/10' : 'bg-white/5'}`}>
                    <span className="font-mono font-black text-sm text-[#C64928] w-10 text-right flex-shrink-0">{r.dorsal}</span>
                    <span className="text-slate-300 text-xs font-bold uppercase truncate">{r.name}</span>
                    {r.skipped && <span className="text-[9px] text-amber-400 font-black ml-auto flex-shrink-0">ya ocupado</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-white/10 flex-shrink-0 space-y-2">
          <div className="flex gap-2">
            <button onClick={() => setIsOpen(false)}
              className="flex-1 py-3 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-slate-300 rounded-xl hover:bg-white/5 transition-colors">
              Cancelar
            </button>
            <button onClick={handleAssign} disabled={loading || loadingPreview || preview.length === 0}
              className="flex-[2] bg-[#C64928] hover:bg-[#a02b10] text-white py-3 rounded-xl font-black uppercase text-[11px] tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? 'Asignando...' : `Confirmar — ${preview.length} corredor(es)`}
            </button>
          </div>
          {/* Reset — discreto, para borrar todos los dorsales del evento */}
          <button
            onClick={async () => {
              if (!confirm('¿Borrar TODOS los dorsales de este evento? Los riders quedarán sin número asignado.')) return;
              const res = await clearEventDorsals(eventId);
              if (res.success) { router.refresh(); }
              else alert('Error: ' + res.message);
            }}
            className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-red-400 transition-colors rounded-lg hover:bg-red-500/10">
            Limpiar todos los dorsales del evento
          </button>
        </div>
      </div>
    </div>
  );
}
