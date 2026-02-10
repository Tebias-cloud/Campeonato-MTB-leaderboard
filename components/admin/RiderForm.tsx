'use client';

import { useActionState, useState, useEffect } from 'react';
import { saveRider, deleteRider } from '@/actions/riders'; // Asegúrate que la ruta sea correcta
import { Rider } from '@/lib/definitions';
import { supabase } from '@/lib/supabase';

// Extendemos la interfaz para incluir los campos nuevos visualmente
interface ExtendedRider extends Partial<Rider> {
  ciudad?: string;
  rut?: string;
}

const initialState = {
  message: null,
  success: false,
};

export default function RiderForm({ initialData }: { initialData?: ExtendedRider }) {
  const [state, formAction, isPending] = useActionState(saveRider, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para RUT y Clubes
  const [rut, setRut] = useState(initialData?.rut || '');
  const [clubsList, setClubsList] = useState<string[]>([]);
  
  // Lógica de estado inicial para el modo de club
  const initialMode = initialData?.club ? 'existing' : 'existing';
  const [clubMode, setClubMode] = useState<'existing' | 'new' | 'none'>(initialMode);
  
  const [selectedClub, setSelectedClub] = useState(initialData?.club || '');
  const [newClubName, setNewClubName] = useState('');

  // Cargar Clubes al inicio
  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('name').order('name');
      if (data) setClubsList(data.map(c => c.name));
    };
    fetchClubs();
  }, []);

  // Formateador de RUT
  const handleRutChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/[^0-9kK]/g, '');
    if (value.length > 1) {
      const body = value.slice(0, -1);
      const dv = value.slice(-1).toUpperCase();
      const formattedBody = body.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
      value = `${formattedBody}-${dv}`;
    }
    setRut(value);
  };

  const defaultDate = initialData?.birth_date 
    ? new Date(initialData.birth_date).toISOString().split('T')[0] 
    : '';

  const defaultCity = initialData?.ciudad || '';
  const inputClass = "w-full p-3 bg-gray-50 text-gray-900 rounded-xl border border-gray-200 outline-none focus:border-[#C64928] font-medium placeholder:text-gray-400";

  const handleDelete = async () => {
    if (!initialData?.id) return;
    if (confirm('¿Estás seguro de eliminar este Rider?')) {
      setIsDeleting(true);
      const result = await deleteRider(initialData.id);
      if (!result.success && result.message) {
        alert(result.message);
        setIsDeleting(false);
      }
    }
  };

  return (
    <form action={formAction} className="space-y-6 bg-white p-8 rounded-3xl shadow-xl border border-gray-100 max-w-2xl mx-auto relative">
      
      <input type="hidden" name="id" value={initialData?.id || ''} />

      {/* Inputs ocultos CLAVES para enviar la lógica del club al Server Action */}
      <input type="hidden" name="club_mode" value={clubMode} />
      <input type="hidden" name="selected_club" value={selectedClub} />
      <input type="hidden" name="new_club_name" value={newClubName} />

      {state.message && (
        <div className={`p-4 rounded-xl border-l-4 font-bold text-sm animate-pulse ${state.success ? 'bg-green-50 border-green-500 text-green-700' : 'bg-red-50 border-red-500 text-red-700'}`}>
          {state.success ? '✅ ' : '⚠️ '} {state.message}
        </div>
      )}

      {/* 1. DATOS PERSONALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nombre Completo</label>
            <input name="full_name" defaultValue={initialData?.full_name || ''} required className={inputClass} placeholder="Ej: Esteban Vidal" />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">RUT (Único)</label>
            <input 
              name="rut" 
              value={rut} 
              onChange={handleRutChange} 
              className={`${inputClass} font-mono`} 
              placeholder="12.345.678-9" 
              maxLength={12} 
              required
            />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Fecha Nacimiento</label>
            <input type="date" name="birth_date" defaultValue={defaultDate} required className={inputClass} />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ciudad</label>
            <input name="ciudad" defaultValue={defaultCity} required className={inputClass} placeholder="Ej: Iquique" />
        </div>
      </div>
      
      {/* 2. CLUB / EQUIPO (Lógica Inteligente) */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
        <label className="block text-xs font-bold uppercase text-gray-500 mb-3">Club / Equipo</label>
        
        <div className="flex gap-2 mb-3">
          <button type="button" onClick={() => setClubMode('existing')} 
            className={`flex-1 text-xs py-2 rounded-lg transition-colors font-bold ${clubMode === 'existing' ? 'bg-[#1A1816] text-white shadow-md' : 'bg-white border text-gray-500 hover:bg-gray-100'}`}>
            Seleccionar
          </button>
          <button type="button" onClick={() => setClubMode('new')} 
            className={`flex-1 text-xs py-2 rounded-lg transition-colors font-bold ${clubMode === 'new' ? 'bg-[#1A1816] text-white shadow-md' : 'bg-white border text-gray-500 hover:bg-gray-100'}`}>
            Nuevo Club
          </button>
          <button type="button" onClick={() => setClubMode('none')} 
            className={`flex-1 text-xs py-2 rounded-lg transition-colors font-bold ${clubMode === 'none' ? 'bg-[#1A1816] text-white shadow-md' : 'bg-white border text-gray-500 hover:bg-gray-100'}`}>
            Sin Club
          </button>
        </div>

        {clubMode === 'existing' && (
          <select 
            value={selectedClub} 
            onChange={e => setSelectedClub(e.target.value)}
            className={inputClass}
          >
            <option value="">-- Selecciona un Club --</option>
            {clubsList.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}

        {clubMode === 'new' && (
          <div>
            <input 
              value={newClubName} 
              onChange={e => setNewClubName(e.target.value)}
              className={`${inputClass} border-[#C64928]`} 
              placeholder="Nombre del nuevo club..." 
            />
            <p className="text-[10px] text-gray-400 mt-1 ml-1">* Se guardará en la lista para el futuro.</p>
          </div>
        )}

        {clubMode === 'none' && (
          <div className="text-center py-2 bg-white rounded-lg border border-dashed border-gray-300">
             {/* CORREGIDO: Usamos &quot; para evitar errores de JSX */}
             <p className="text-xs text-gray-400 italic">El corredor quedará registrado como &quot;Independiente&quot; (Campo vacío).</p>
          </div>
        )}
      </div>

      {/* 3. CATEGORÍA */}
      <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Categoría 2026</label>
            <select name="category" defaultValue={initialData?.category || 'Novicios Open'} className={inputClass}>
                <optgroup label="Varones" className="font-bold bg-gray-100">
                    <option value="Novicios Open">Novicios Open</option>
                    <option value="Pre Master">Pre Master (16-29)</option>
                    <option value="Master A">Máster A (30-39)</option>
                    <option value="Master B">Máster B (40-49)</option>
                    <option value="Master C">Máster C (50-59)</option>
                    <option value="Master D">Máster D (60+)</option>
                    <option value="Elite Open">Elite Open</option>
                </optgroup>
                <optgroup label="Damas" className="font-bold bg-gray-100">
                    <option value="Novicias Open">Novicias Open</option>
                    <option value="Damas Pre Master">Damas Pre Master (16-29)</option>
                    <option value="Damas Master A">Damas Máster A (30-39)</option>
                    <option value="Damas Master B">Damas Máster B (40-49)</option>
                    <option value="Damas Master D">Damas Máster D (50+)</option>
                </optgroup>
                <optgroup label="Mixtas" className="font-bold bg-gray-100">
                    <option value="Enduro Open Mixto">Enduro Open Mixto</option>
                    <option value="E-Bike Open Mixto">E-Bike Open Mixto</option>
                </optgroup>
            </select>
      </div>

      {/* 4. INSTAGRAM */}
      <div>
        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Instagram (con @)</label>
        <input name="instagram" defaultValue={initialData?.instagram || ''} className={inputClass} placeholder="@usuario" />
      </div>

      {/* BOTONES */}
      <div className="flex flex-col gap-3 pt-4">
          <button 
            type="submit" 
            disabled={isPending || isDeleting}
            className={`w-full py-4 text-white font-heading text-xl rounded-xl transition-all shadow-lg uppercase tracking-wider flex justify-center items-center ${
                isPending ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#C64928] hover:bg-[#A03518]'
            }`}
          >
            {isPending ? 'Guardando...' : (initialData ? 'Guardar Cambios' : 'Crear Rider')}
          </button>

          {initialData && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={isPending || isDeleting}
                className="w-full py-3 bg-white text-red-500 font-bold uppercase text-xs tracking-widest border border-red-100 rounded-xl hover:bg-red-50 hover:border-red-200 transition-colors flex justify-center items-center gap-2"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar Rider'}
              </button>
          )}
      </div>

    </form>
  );
}