'use client';

import { useActionState, useState, useEffect } from 'react';
import { saveRider, deleteRider } from '@/actions/riders';
import { Rider } from '@/lib/definitions';
import { supabase } from '@/lib/supabase';

export default function RiderForm({ initialData }: { initialData?: Rider }) {
  const [state, formAction, isPending] = useActionState(saveRider, { message: null, success: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [clubsList, setClubsList] = useState<string[]>([]);
  const [rut, setRut] = useState(initialData?.rut || '');
  const [club, setClub] = useState(initialData?.club || 'INDEPENDIENTE / LIBRE');
  const [isManualClub, setIsManualClub] = useState(false);

  // EFECTO ESTABILIZADO: Carga la lista de clubes y detecta si el club es manual
  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('name').order('name');
      if (data) {
        const names = data.map(c => c.name);
        setClubsList(names);
        
        // Si el rider tiene un club que NO está en la lista oficial, activar modo manual
        if (initialData?.club && 
            initialData.club !== 'INDEPENDIENTE / LIBRE' && 
            !names.includes(initialData.club)) {
          setIsManualClub(true);
        }
      }
    };
    fetchClubs();
  }, []); // Array vacío para evitar errores de renderizado

  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9kK]/g, '');
    if (value.length > 9) value = value.slice(0, 9);
    
    if (value.length > 1) {
      const body = value.slice(0, -1);
      const dv = value.slice(-1).toUpperCase();
      const formatted = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      setRut(`${formatted}-${dv}`);
    } else {
      setRut(value);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (confirm('⚠️ ¿BORRAR RIDER DEFINITIVAMENTE?\nEsta acción no se puede deshacer.')) {
      setIsDeleting(true);
      const res = await deleteRider(initialData.id);
      if (!res?.success) {
        alert(res?.message || "Error al eliminar");
        setIsDeleting(false);
      }
    }
  };

  const inputClass = "w-full h-12 px-4 bg-slate-50 text-[#1A1816] rounded-xl border-2 border-slate-200 focus:border-[#C64928] focus:bg-white outline-none font-bold text-sm uppercase transition-all placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1 tracking-wider";

  return (
    <form action={formAction} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-2xl border-t-[10px] border-[#C64928]">
      <input type="hidden" name="id" value={initialData?.id || ''} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* SECCIÓN 1: PERSONAL */}
        <div className="space-y-4">
          <h3 className="font-heading text-3xl uppercase italic text-slate-800 border-b-2 border-slate-100 pb-1">01. Personal</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Nombre Completo *</label>
              <input name="full_name" defaultValue={initialData?.full_name || ''} required className={inputClass} placeholder="NOMBRE Y APELLIDO" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>RUT *</label>
                <input name="rut" value={rut} onChange={handleRutChange} required className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label className={labelClass}>Nacimiento *</label>
                <input 
                  type="date" 
                  name="birth_date" 
                  defaultValue={initialData?.birth_date ? new Date(initialData.birth_date).toISOString().split('T')[0] : ''} 
                  required 
                  className={inputClass} 
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: CARRERA - CATEGORÍAS COMPLETAS */}
        <div className="space-y-4">
          <h3 className="font-heading text-3xl uppercase italic text-slate-800 border-b-2 border-slate-100 pb-1">02. Carrera</h3>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Categoría Oficial *</label>
              <select name="category" defaultValue={initialData?.category || ''} required className={inputClass}>
                <option value="" disabled>SELECCIONAR CATEGORÍA</option>
                <optgroup label="VARONES">
                  <option value="Novicios Open">Novicios Open</option>
                  <option value="Elite Open">Elite Open</option>
                  <option value="Pre Master">Pre Master</option>
                  <option value="Master A">Master A</option>
                  <option value="Master B">Master B</option>
                  <option value="Master C">Master C</option>
                  <option value="Master D">Master D</option>
                </optgroup>
                <optgroup label="DAMAS">
                  <option value="Novicias Open">Novicias Open</option>
                  <option value="Damas Pre Master">Damas Pre Master</option>
                  <option value="Damas Master A">Damas Master A</option>
                  <option value="Damas Master B">Damas Master B</option>
                  <option value="Damas Master D">Damas Master D</option>
                </optgroup>
                <optgroup label="MIXTAS">
                  <option value="Enduro Open Mixto">Enduro Open Mixto</option>
                  <option value="E-Bike Open Mixto">E-Bike Open Mixto</option>
                </optgroup>
              </select>
            </div>
            <div>
              <label className={labelClass}>Club / Team *</label>
              <div className="relative">
                {/* Usamos el atributo name="club" directamente para que el Action reciba el valor correcto */}
                {isManualClub ? (
                  <div className="flex gap-2 animate-in fade-in">
                    <input 
                      name="club"
                      type="text" 
                      value={club}
                      onChange={(e) => setClub(e.target.value)} 
                      className={`${inputClass} border-[#C64928] bg-white text-black`} 
                      placeholder="ESCRIBE EL NUEVO CLUB" 
                      autoFocus 
                    />
                    <button 
                      type="button" 
                      onClick={() => { setIsManualClub(false); setClub('INDEPENDIENTE / LIBRE'); }} 
                      className="w-12 h-12 bg-slate-200 text-slate-600 rounded-xl font-black"
                    >
                      ↩
                    </button>
                  </div>
                ) : (
                  <div className="relative group">
                    <select 
                      name="club"
                      value={club} 
                      onChange={(e) => {
                        if (e.target.value === "__MANUAL__") {
                          setIsManualClub(true);
                          setClub('');
                        } else {
                          setClub(e.target.value);
                        }
                      }} 
                      className={`${inputClass} appearance-none cursor-pointer`}
                    >
                      <option value="INDEPENDIENTE / LIBRE">⭐ INDEPENDIENTE / LIBRE</option>
                      {clubsList.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="__MANUAL__" className="bg-[#C64928] text-white font-black">✍️ ESCRIBIR OTRO / NUEVO...</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C64928] font-black text-xs">▼</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: CONTACTO */}
        <div className="md:col-span-2 space-y-4 pt-4 border-t-2 border-slate-50">
          <h3 className="font-heading text-3xl uppercase italic text-slate-800 border-b-2 border-slate-100 pb-1">03. Contacto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <input name="ciudad" defaultValue={initialData?.ciudad || ''} className={inputClass} placeholder="CIUDAD" />
            <input name="phone" defaultValue={initialData?.phone || ''} className={inputClass} placeholder="TELÉFONO" />
            <input name="email" type="email" defaultValue={initialData?.email || ''} className={`${inputClass} lowercase`} placeholder="MAIL" />
            <input name="instagram" defaultValue={initialData?.instagram || ''} className={`${inputClass} lowercase`} placeholder="@USER" />
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col md:flex-row gap-4">
        <button 
          type="submit" 
          disabled={isPending || isDeleting} 
          className="flex-[3] h-16 bg-[#C64928] text-white font-heading text-4xl rounded-2xl shadow-xl uppercase italic hover:bg-[#1A1816] transition-all border-b-[6px] border-black/20 active:border-b-0 disabled:opacity-50"
        >
          {isPending ? 'GUARDANDO...' : (initialData ? 'GUARDAR CAMBIOS' : 'CREAR CORREDOR')}
        </button>

        {initialData && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending || isDeleting}
            className="flex-1 h-16 bg-white text-red-600 font-black border-2 border-red-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all text-xs uppercase tracking-widest"
          >
            {isDeleting ? '...' : 'ELIMINAR'}
          </button>
        )}
      </div>

      {state?.message && (
        <p className={`text-center mt-6 font-black uppercase text-xs tracking-widest ${state.success ? 'text-green-600' : 'text-[#C64928]'}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}