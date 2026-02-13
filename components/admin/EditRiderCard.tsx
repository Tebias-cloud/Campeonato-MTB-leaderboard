'use client';

import { useActionState, useState, useEffect } from 'react';
import { saveRider, type RiderState } from '@/actions/riders';
import { Rider } from '@/lib/definitions';

interface Props {
  rider: Rider;
  clubs: string[];
}

const initialState: RiderState = { message: null, success: false };

export default function EditRiderCard({ rider, clubs }: Props) {
  const [state, formAction, isPending] = useActionState(saveRider, initialState);
  
  const [formData, setFormData] = useState(rider);
  const [isCreatingClub, setIsCreatingClub] = useState(false);

  // Manejador unificado de cambios
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // LÓGICA SELECTOR DE CLUB
    if (name === 'club_selector') {
        if (value === 'NEW_CLUB_TRIGGER') {
            setIsCreatingClub(true);
            setFormData({ ...formData, club: '' }); // Limpiar para escribir
        } else {
            setIsCreatingClub(false);
            setFormData({ ...formData, club: value });
        }
        return;
    }

    setFormData({ ...formData, [name]: value });
  };

  // Feedback de errores
  useEffect(() => {
    if (state.message && !state.success) alert(state.message);
  }, [state]);

  // Valor visual del Select
  const currentSelectValue = isCreatingClub 
    ? 'NEW_CLUB_TRIGGER' 
    : (formData.club && formData.club !== 'INDEPENDIENTE / LIBRE' ? formData.club : 'INDEPENDIENTE / LIBRE');

  return (
    <form 
      action={formAction}
      className="bg-[#1A1816] text-white rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden border-b-[8px] border-[#C64928]"
    >
      <input type="hidden" name="id" value={rider.id} />
      
      {/* Inputs ocultos para enviar la lógica correcta al servidor */}
      <input type="hidden" name="club_mode" value={isCreatingClub ? 'new' : 'existing'} />
      {!isCreatingClub && <input type="hidden" name="selected_club" value={formData.club || 'INDEPENDIENTE / LIBRE'} />}

      {/* --- CABECERA --- */}
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start mb-8 border-b border-white/10 pb-8">
        <div className="flex flex-col items-center gap-3">
          <div className="w-24 h-24 bg-white text-[#1A1816] rounded-3xl flex items-center justify-center font-heading text-6xl shadow-lg border-4 border-[#C64928]">
            {formData.full_name ? formData.full_name[0] : '?'}
          </div>
          <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-black/30 px-3 py-1 rounded-full">
            EDITANDO
          </span>
        </div>

        <div className="flex-1 w-full grid gap-6">
          <div>
            <label className="text-[10px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">Nombre Completo</label>
            <input 
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="w-full bg-transparent text-4xl md:text-5xl font-heading uppercase tracking-tighter text-white border-b-2 border-white/20 focus:border-[#C64928] outline-none placeholder:text-gray-700 transition-all pb-1"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1 block">Categoría Oficial</label>
              <select 
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full bg-white/10 text-white border border-white/10 rounded-xl px-4 py-3 font-bold uppercase focus:bg-[#C64928] focus:border-[#C64928] outline-none transition-all cursor-pointer"
                required
              >
                 <optgroup label="VARONES">
                    {["Elite Open", "Pre Master", "Master A", "Master B", "Master C", "Master D", "Novicios Open"].map(c => <option key={c} value={c}>{c}</option>)}
                 </optgroup>
                 <optgroup label="DAMAS">
                    {["Damas Pre Master", "Damas Master A", "Damas Master B", "Damas Master C", "Novicias Open"].map(c => <option key={c} value={c}>{c}</option>)}
                 </optgroup>
                 <optgroup label="MIXTAS">
                    <option value="EBike Mixto Open">EBike Mixto Open</option>
                    <option value="Enduro Mixto Open">Enduro Mixto Open</option>
                 </optgroup>
              </select>
            </div>

            {/* SELECTOR DE CLUB */}
            <div>
              <div className="flex justify-between items-center mb-1">
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest block">Club / Team</label>
                  {isCreatingClub && (
                      <button 
                        type="button" 
                        onClick={() => { setIsCreatingClub(false); setFormData({...formData, club: 'INDEPENDIENTE / LIBRE'}); }}
                        className="text-[9px] text-[#C64928] font-bold uppercase hover:underline"
                      >
                        Cancelar creación
                      </button>
                  )}
              </div>
              
              <div className="relative">
                <span className="absolute left-3 top-3 text-lg">🛡️</span>
                
                {isCreatingClub ? (
                    <input 
                        name="new_club_name"
                        placeholder="Escribe nuevo nombre..."
                        autoFocus
                        className="w-full pl-10 bg-white/10 text-white border border-[#C64928] rounded-xl px-4 py-3 font-bold uppercase focus:bg-white/20 outline-none placeholder:text-gray-500 animate-pulse-once"
                    />
                ) : (
                    <select 
                      name="club_selector"
                      value={currentSelectValue}
                      onChange={handleChange}
                      className="w-full pl-10 bg-white/10 text-white border border-white/10 rounded-xl px-4 py-3 font-bold uppercase focus:bg-[#C64928] focus:border-[#C64928] outline-none transition-all cursor-pointer appearance-none"
                    >
                      <option className="bg-[#1A1816]" value="INDEPENDIENTE / LIBRE">INDEPENDIENTE / LIBRE</option>
                      {clubs.map(c => (
                        <option className="bg-[#1A1816]" key={c} value={c}>{c}</option>
                      ))}
                      <option className="bg-[#C64928] text-white font-black" value="NEW_CLUB_TRIGGER">+ CREAR NUEVO CLUB...</option>
                    </select>
                )}
                
                {!isCreatingClub && (
                    <div className="absolute right-4 top-4 pointer-events-none text-slate-400">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569l9 13z"/></svg>
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- GRILLA DE DATOS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">RUT</label>
          <input 
            name="rut"
            value={formData.rut || ''}
            onChange={handleChange}
            className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-mono font-bold focus:border-[#C64928] outline-none"
            placeholder="12345678-9"
            required
          />
        </div>

        <div>
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">Ciudad</label>
          <input 
            name="ciudad"
            value={formData.ciudad || ''}
            onChange={handleChange}
            className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-bold uppercase focus:border-[#C64928] outline-none"
            placeholder="IQUIQUE"
            required
          />
        </div>

        <div>
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">Fecha Nacimiento</label>
          <input 
            type="date"
            name="birth_date"
            value={formData.birth_date ? formData.birth_date.split('T')[0] : ''}
            onChange={handleChange}
            className="w-full bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-bold focus:border-[#C64928] outline-none"
          />
        </div>

        <div className="md:col-span-2">
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">Correo Electrónico</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-slate-400 text-sm">✉️</span>
            <input 
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full pl-10 bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-bold focus:border-[#C64928] outline-none"
                placeholder="sin-email@registrado.com"
            />
          </div>
        </div>

        <div>
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">WhatsApp</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-slate-400 text-sm">📱</span>
            <input 
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full pl-10 bg-white/5 text-white border border-white/10 rounded-xl px-4 py-3 font-bold focus:border-[#C64928] outline-none"
                placeholder="+569..."
            />
          </div>
        </div>

         <div className="md:col-span-3 border-t border-white/10 pt-4 mt-2">
          <label className="text-[9px] text-[#C64928] uppercase font-black tracking-widest mb-1 block">Instagram</label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-slate-400 font-bold">@</span>
            <input 
              name="instagram"
              value={formData.instagram || ''}
              onChange={handleChange}
              className="w-full pl-9 bg-white/5 text-blue-300 border border-white/10 rounded-xl px-4 py-3 font-bold focus:border-[#C64928] outline-none"
              placeholder="usuario"
            />
          </div>
        </div>
      </div>

      {/* BOTÓN GUARDAR */}
      <div className="mt-8 flex justify-end">
        <button 
          type="submit" 
          disabled={isPending}
          className="bg-[#C64928] text-white font-heading text-2xl uppercase px-12 py-4 rounded-2xl hover:bg-white hover:text-[#1A1816] transition-all shadow-lg hover:shadow-orange-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 transform active:scale-95"
        >
          {isPending ? 'Guardando...' : '💾 Guardar Cambios'}
        </button>
      </div>
    </form>
  );
}