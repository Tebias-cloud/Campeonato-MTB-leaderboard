'use client';

import { useState } from 'react';
import { OFFICIAL_CATEGORIES } from '@/lib/categories';
import { assignMassiveDorsals } from '@/actions/dorsals';

interface Props {
  eventId: string;
}

export default function MassiveDorsalAssigner({ eventId }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState(OFFICIAL_CATEGORIES[0].id);
  const [startNum, setStartNum] = useState(100);
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!confirm(`¿Asignar dorsales correlativos a partir del ${startNum} para la categoría ${category}?`)) return;
    
    setLoading(true);
    const result = await assignMassiveDorsals(eventId, category, startNum);
    setLoading(false);
    
    if (result.success) {
      alert(result.message);
      setIsOpen(false);
    } else {
      alert(result.message);
    }
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="bg-white/10 hover:bg-white/20 text-[#EFE6D5] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2"
      >
        🔢 Asignación en Bloque
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="bg-[#1A1816] p-6 text-white flex justify-between items-center text-left">
          <div>
            <h3 className="text-xl font-heading uppercase italic tracking-tighter">Asignador Masivo</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase">Correlativos por Categoría</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors">✕</button>
        </div>
        
        <div className="p-6 space-y-5 text-left">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">1. Selecciona Categoría</label>
            <select 
              value={category} 
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 border-2 border-gray-100 font-bold text-xs outline-none focus:border-[#C64928]"
            >
              {OFFICIAL_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-gray-400 uppercase">2. Número Inicial</label>
            <input 
              type="number" 
              value={startNum}
              onChange={(e) => setStartNum(parseInt(e.target.value))}
              className="w-full p-3 rounded-lg bg-gray-50 text-gray-900 border-2 border-gray-100 font-mono font-bold text-sm outline-none focus:border-[#C64928]"
            />
            <p className="text-[9px] text-gray-400 font-medium italic mt-1">
              Ej: Si pones 101, los corredores serán 101, 102, 103...
            </p>
          </div>

          <div className="flex gap-4 pt-2">
            <button 
              onClick={() => setIsOpen(false)}
              className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-gray-400"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAssign}
              disabled={loading}
              className="flex-[2] bg-[#1A1816] hover:bg-[#C64928] text-white py-4 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all disabled:opacity-50 shadow-lg"
            >
              {loading ? 'Asignando...' : 'Iniciar Asignación'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
