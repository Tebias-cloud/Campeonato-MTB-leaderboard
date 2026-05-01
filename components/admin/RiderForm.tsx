'use client';

import { useActionState, useState, useEffect } from 'react';
import { saveRider, deleteRider, deleteRiderFromEvent } from '@/actions/riders';
import { Rider } from '@/lib/definitions';
import { supabase } from '@/lib/supabase';
import { OFFICIAL_CATEGORIES } from '@/lib/categories';

// Función para calcular la edad al 31 de diciembre de 2026 (Edad de competición UCI)
const calculateRacingAge2026 = (birthDateStr?: string) => {
  if (!birthDateStr) return null;
  const birthYear = new Date(birthDateStr).getFullYear();
  if (isNaN(birthYear)) return null;
  return 2026 - birthYear;
};

export default function RiderForm({ 
  initialData, 
  inscribedEvents = [] 
}: { 
  initialData?: Rider;
  inscribedEvents?: {id: string, name: string}[];
}) {
  const [state, formAction, isPending] = useActionState(saveRider, { message: null, success: false });
  const [isDeleting, setIsDeleting] = useState(false);
  const [clubsList, setClubsList] = useState<string[]>([]);
  const [rut, setRut] = useState(initialData?.rut || '');
  const [club, setClub] = useState(initialData?.club || 'INDEPENDIENTE / LIBRE');
  const [category, setCategory] = useState(initialData?.category || OFFICIAL_CATEGORIES[0].id);
  const [isManualClub, setIsManualClub] = useState(false);
  const [showDeleteOptions, setShowDeleteOptions] = useState(false);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  
  // Estado para la fecha de nacimiento (para poder calcular la edad en tiempo real)
  const [birthDate, setBirthDate] = useState(
    initialData?.birth_date ? new Date(initialData.birth_date).toISOString().split('T')[0] : ''
  );

  // EFECTO ESTABILIZADO: Carga la lista de clubes y detecta si el club es manual
  useEffect(() => {
    const fetchClubs = async () => {
      const [clubsData, ridersData] = await Promise.all([
        supabase.from('clubs').select('name'),
        supabase.from('riders').select('club')
      ]);

      if (clubsData.data) {
        // Contar ocurrencias para ordenar por popularidad
        const counts: Record<string, number> = {};
        ridersData.data?.forEach(r => {
          if (r.club) {
            const name = r.club.trim().toUpperCase();
            counts[name] = (counts[name] || 0) + 1;
          }
        });

        // Asegurar que la lista sea de valores ÚNICOS y en MAYÚSCULAS
        const rawClubNames = (clubsData.data || []).map(c => c.name.trim().toUpperCase());
        const uniqueClubs = Array.from(new Set(rawClubNames));
        
        const sorted = uniqueClubs.sort((a, b) => (counts[b] || 0) - (counts[a] || 0));

        setClubsList(sorted);
        
        // Si el rider tiene un club que NO está en la lista oficial, activar modo manual
        if (initialData?.club) {
          const riderClubFull = initialData.club.trim().toUpperCase();
          if (riderClubFull !== 'INDEPENDIENTE / LIBRE' && !sorted.includes(riderClubFull)) {
            setIsManualClub(true);
            setClub(riderClubFull);
          }
        }
      }
    };
    fetchClubs();
  }, [initialData]); 

  const [rutError, setRutError] = useState<string | null>(null);

  // EFECTO: Validación de RUT duplicado en tiempo real
  useEffect(() => {
    const checkDuplicateRut = async () => {
      // Solo chequeamos si el RUT está completo (mínimo 8 caracteres formateados)
      if (rut.length < 8) {
        setRutError(null);
        return;
      }
      
      // Si estamos editando y el RUT no ha cambiado, no avisar
      if (initialData?.id && rut === initialData.rut) {
        setRutError(null);
        return;
      }

      const { data } = await supabase
        .from('riders')
        .select('id, full_name')
        .eq('rut', rut)
        .maybeSingle();

      if (data) {
        setRutError(`⚠️ RUT registrado a: ${data.full_name}`);
      } else {
        setRutError(null);
      }
    };

    const timer = setTimeout(checkDuplicateRut, 500);
    return () => clearTimeout(timer);
  }, [rut, initialData]);

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

  const handleDeleteClick = () => {
    if (inscribedEvents.length > 0) {
      setShowDeleteOptions(!showDeleteOptions);
    } else {
      handleDelete();
    }
  };

  const handleDeleteEvent = async (eventId: string, eventName: string) => {
    if (confirm(`⚠️ ¿ELIMINAR INSCRIPCIÓN DE "${eventName}"?\nEsta acción no borrará el corredor, solo su registro en esta fecha.`)) {
      setIsDeletingEvent(true);
      const res = await deleteRiderFromEvent(initialData!.id, eventId);
      if (!res?.success) {
        alert(res?.message || "Error al eliminar inscripción");
      } else {
        setShowDeleteOptions(false);
      }
      setIsDeletingEvent(false);
    }
  };

  const inputClass = "w-full h-12 px-4 bg-slate-50 text-[#1A1816] rounded-xl border-2 border-slate-200 focus:border-[#C64928] focus:bg-white outline-none font-bold text-sm uppercase transition-all placeholder:text-slate-400";
  const labelClass = "block text-[10px] font-black uppercase text-slate-500 mb-1 ml-1 tracking-wider";

  // Calcular la edad basada en la fecha que esté actualmente en el input
  const racingAge = calculateRacingAge2026(birthDate);

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
                <input name="rut" value={rut} onChange={handleRutChange} required className={`${inputClass} font-mono ${rutError ? 'border-orange-500 bg-orange-50' : ''}`} />
                {rutError && <p className="text-[10px] font-black text-orange-600 mt-1 animate-pulse tracking-tight">{rutError}</p>}
              </div>
              <div className="relative">
                <label className={labelClass}>Nacimiento *</label>
                <input 
                  type="date" 
                  name="birth_date" 
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  required 
                  className={inputClass} 
                />
                {/* ETIQUETA DE EDAD CALCULADA EN TIEMPO REAL */}
                {racingAge !== null && (
                  <div className="absolute -bottom-6 left-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                    Edad Competición: {racingAge} Años
                  </div>
                )}
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
              <select 
                name="category" 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required 
                className={inputClass}
              >
                <optgroup label="VARONES">
                  {OFFICIAL_CATEGORIES.filter(c => c.group === 'VARONES').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="DAMAS">
                  {OFFICIAL_CATEGORIES.filter(c => c.group === 'DAMAS').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
                <optgroup label="MIXTAS">
                  {OFFICIAL_CATEGORIES.filter(c => c.group === 'MIXTAS').map(c => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div>
              <label className={labelClass}>Club / Team *</label>
              <div className="relative">
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
                      className="w-12 h-12 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-black transition-colors"
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
        <div className="md:col-span-2 space-y-4 pt-4 mt-2 border-t-2 border-slate-50">
          <h3 className="font-heading text-3xl uppercase italic text-slate-800 border-b-2 border-slate-100 pb-1">03. Contacto</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className={labelClass}>Ciudad</label>
              <input name="ciudad" defaultValue={initialData?.ciudad || ''} className={inputClass} placeholder="CIUDAD" />
            </div>
            <div>
              <label className={labelClass}>Teléfono</label>
              <input name="phone" defaultValue={initialData?.phone || ''} className={inputClass} placeholder="9 1234 5678" />
              <p className="text-[9px] text-slate-400 mt-1 font-bold italic">Se normaliza automáticamente a +56 9...</p>
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input name="email" type="email" defaultValue={initialData?.email || ''} className={`${inputClass} lowercase`} placeholder="MAIL" />
            </div>
            <div>
              <label className={labelClass}>Instagram</label>
              <input name="instagram" defaultValue={initialData?.instagram || ''} className={`${inputClass} lowercase`} placeholder="@USER" />
            </div>
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
          <div className="flex-1 relative">
            <button
              type="button"
              onClick={handleDeleteClick}
              disabled={isPending || isDeleting || isDeletingEvent}
              className="w-full h-16 bg-white text-red-600 font-black border-2 border-red-100 rounded-2xl hover:bg-red-600 hover:text-white transition-all text-xs uppercase tracking-widest"
            >
              {isDeleting || isDeletingEvent ? '...' : 'ELIMINAR'}
            </button>

            {showDeleteOptions && (
              <div className="absolute bottom-full left-0 w-full mb-2 bg-white rounded-xl shadow-xl border-2 border-red-100 overflow-hidden z-50">
                <div className="p-3 bg-slate-50 border-b border-slate-100">
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest text-center">Opciones de Eliminación</p>
                </div>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full p-4 text-left hover:bg-red-50 text-red-600 font-bold text-xs uppercase transition-colors border-b border-slate-100"
                >
                  ⚠️ BORRAR CORREDOR COMPLETAMENTE
                </button>
                {inscribedEvents.map(event => (
                  <button
                    key={event.id}
                    type="button"
                    onClick={() => handleDeleteEvent(event.id, event.name)}
                    className="w-full p-4 text-left hover:bg-orange-50 text-orange-600 font-bold text-[11px] uppercase transition-colors border-b border-slate-100 last:border-0"
                  >
                    Quitar inscripción: {event.name}
                  </button>
                ))}
              </div>
            )}
          </div>
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