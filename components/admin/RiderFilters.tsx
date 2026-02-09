'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
// import { useDebouncedCallback } from 'use-debounce'; // Si decides instalarlo después

export default function RiderFilters() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Función para actualizar la URL (Buscador)
  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  // Función para actualizar la URL (Categoría)
  const handleCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category && category !== 'Todas') {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 mb-6">
      
      {/* BUSCADOR DE TEXTO */}
      <div className="flex-1">
        <input
          type="text"
          placeholder="Buscar por Nombre o Club..."
          className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:border-[#C64928] shadow-sm"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={searchParams.get('query')?.toString()}
        />
      </div>

      {/* FILTRO DE CATEGORÍA - ACTUALIZADO CON TUS NUEVAS CATEGORÍAS */}
      <div className="w-full md:w-1/3">
        <select
          className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold focus:outline-none focus:border-[#C64928] shadow-sm appearance-none cursor-pointer"
          onChange={(e) => handleCategory(e.target.value)}
          defaultValue={searchParams.get('category')?.toString() || 'Todas'}
        >
          <option value="Todas">Todas las Categorías</option>
          
          <optgroup label="Varones">
            <option value="Novicios Open">Novicios Open</option>
            <option value="Pre Master">Pre Master (16-29)</option>
            <option value="Master A">Master A (30-39)</option>
            <option value="Master B">Master B (40-49)</option>
            <option value="Master C">Master C (50-59)</option>
            <option value="Master D">Master D (60+)</option>
            <option value="Elite Open">Elite Open</option>
          </optgroup>

          <optgroup label="Damas">
            <option value="Novicias Open">Novicias Open</option>
            <option value="Damas Pre Master">Damas Pre Master</option>
            <option value="Damas Master A">Damas Master A</option>
            <option value="Damas Master B">Damas Master B</option>
            <option value="Damas Master D">Damas Master D</option>
          </optgroup>

          <optgroup label="Mixtas">
            <option value="Enduro Open Mixto">Enduro Open Mixto</option>
            <option value="E-Bike Open Mixto">E-Bike Open Mixto</option>
          </optgroup>
        </select>
      </div>
    </div>
  );
}