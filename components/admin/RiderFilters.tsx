'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { CATEGORY_GROUPS } from '@/lib/definitions';

function FiltersContent({
  events = []
}: {
  events?: { id: string | number; name: string; date?: string }[]
}) {
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

  // Función para actualizar la URL (Evento)
  const handleEvent = (eventId: string) => {
    const params = new URLSearchParams(searchParams);
    if (eventId && eventId !== 'all') {
      params.set('eventId', eventId);
    } else {
      params.delete('eventId');
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
    <div className="flex flex-col md:flex-row gap-4 items-center w-full">
      
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

      {/* FILTRO DE EVENTO */}
      <div className="w-full md:w-1/4">
        <select
          className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold focus:outline-none focus:border-[#C64928] shadow-sm appearance-none cursor-pointer"
          onChange={(e) => handleEvent(e.target.value)}
          defaultValue={searchParams.get('eventId')?.toString() || 'all'}
        >
          <option value="all">Todos los Eventos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* FILTRO DE CATEGORÍA - CORREGIDO */}
      <div className="w-full md:w-1/4">
        <select
          className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold focus:outline-none focus:border-[#C64928] shadow-sm appearance-none cursor-pointer"
          onChange={(e) => handleCategory(e.target.value)}
          defaultValue={searchParams.get('category')?.toString() || 'Todas'}
        >
          <option value="Todas">Todas las Categorías</option>
          
          {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
            <optgroup key={groupName} label={groupName}>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}

export default function RiderFilters({
  events = []
}: {
  events?: { id: string | number; name: string; date?: string }[]
}) {
  return (
    <Suspense fallback={<div className="animate-pulse h-14 bg-slate-100 rounded-xl w-full"></div>}>
      <FiltersContent events={events} />
    </Suspense>
  );
}