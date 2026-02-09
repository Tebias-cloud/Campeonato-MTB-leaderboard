'use client';

import { useActionState, useState } from 'react';
import { saveRider, deleteRider } from '@/actions/riders';
import { Rider } from '@/lib/definitions'; 

// Extendemos la interfaz para incluir 'ciudad' si no está en tu archivo definitions.ts aún
interface ExtendedRider extends Partial<Rider> {
  ciudad?: string;
  // region?: string; // Ya no usamos region
}

const initialState = {
  message: null,
  success: false,
};

export default function RiderForm({ initialData }: { initialData?: ExtendedRider }) {
  const [state, formAction, isPending] = useActionState(saveRider, initialState);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const defaultDate = initialData?.birth_date 
    ? new Date(initialData.birth_date).toISOString().split('T')[0] 
    : '';

  // CORRECCIÓN: Leemos 'ciudad' de los datos iniciales
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

      {state.message && (
        <div className="p-4 rounded-xl bg-red-50 border-l-4 border-red-500 text-red-700 font-bold text-sm animate-pulse">
          ⚠️ {state.message}
        </div>
      )}

      {/* 1. DATOS PERSONALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Nombre Completo</label>
            <input name="full_name" defaultValue={initialData?.full_name || ''} required className={inputClass} placeholder="Ej: Esteban Vidal" />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Fecha Nacimiento</label>
            <input type="date" name="birth_date" defaultValue={defaultDate} required className={inputClass} />
        </div>
      </div>
      
      {/* 2. UBICACIÓN Y CLUB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Ciudad</label>
            {/* CORRECCIÓN: name="ciudad" */}
            <input 
                type="text" 
                name="ciudad" 
                defaultValue={defaultCity} 
                required 
                className={inputClass} 
                placeholder="Ej: Iquique" 
            />
        </div>
        <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Club / Team</label>
            <input name="club" defaultValue={initialData?.club || ''} className={inputClass} placeholder="Ej: Iquique Riders" />
        </div>
      </div>

      {/* 3. CATEGORÍA */}
      <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Categoría 2026</label>
            <select name="category" defaultValue={initialData?.category || 'Novicios Open'} className={inputClass}>
                <optgroup label="Varones" className="text-gray-900 font-bold bg-gray-100">
                    <option value="Novicios Open">Novicios Open</option>
                    <option value="Pre Master">Pre Master (16-29)</option>
                    <option value="Master A">Máster A (30-39)</option>
                    <option value="Master B">Máster B (40-49)</option>
                    <option value="Master C">Máster C (50-59)</option>
                    <option value="Master D">Máster D (60+)</option>
                    <option value="Elite Open">Elite Open</option>
                </optgroup>
                <optgroup label="Damas" className="text-gray-900 font-bold bg-gray-100">
                    <option value="Novicias Open">Novicias Open</option>
                    <option value="Damas Pre Master">Damas Pre Master (16-29)</option>
                    <option value="Damas Master A">Damas Máster A (30-39)</option>
                    <option value="Damas Master B">Damas Máster B (40-49)</option>
                    <option value="Damas Master D">Damas Máster D (50+)</option>
                </optgroup>
                <optgroup label="Mixtas" className="text-gray-900 font-bold bg-gray-100">
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