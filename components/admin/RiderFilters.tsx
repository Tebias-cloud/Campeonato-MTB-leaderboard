'use client';

import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { CATEGORY_GROUPS } from '@/lib/categories';

export default function RiderFilters({
  events = []
}: {
  events?: { id: string | number; name: string; date?: string }[]
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentEventId = searchParams.get('eventId') || 'all';
  const currentCategory = searchParams.get('category') || 'Todas';
  const currentQuery = searchParams.get('query') || '';

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) params.set('query', term);
    else params.delete('query');
    replace(`${pathname}?${params.toString()}`);
  };

  const handleEvent = (eventId: string) => {
    const params = new URLSearchParams(searchParams);
    if (eventId && eventId !== 'all') params.set('eventId', eventId);
    else params.delete('eventId');
    replace(`${pathname}?${params.toString()}`);
  };

  const handleCategory = (category: string) => {
    const params = new URLSearchParams(searchParams);
    if (category && category !== 'Todas') params.set('category', category);
    else params.delete('category');
    replace(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center w-full">
      <div className="flex-1">
        <input
          type="text"
          placeholder="Buscar por Nombre, RUT o Club..."
          className="w-full p-4 rounded-xl border border-gray-200 bg-white text-gray-900 font-bold placeholder:text-gray-400 focus:outline-none focus:border-[#C64928] shadow-sm"
          onChange={(e) => handleSearch(e.target.value)}
          defaultValue={currentQuery}
        />
      </div>

      {/* Selector de Evento — controlado para reflejar URL */}
      <div className="w-full md:w-1/4 flex items-center gap-2">
        <select
          className={`flex-1 p-4 rounded-xl border-2 font-bold focus:outline-none shadow-sm appearance-none cursor-pointer transition-colors ${
            currentEventId !== 'all'
              ? 'border-[#C64928] bg-orange-50 text-[#C64928]'
              : 'border-gray-200 bg-white text-gray-900 focus:border-[#C64928]'
          }`}
          value={currentEventId}
          onChange={(e) => handleEvent(e.target.value)}
        >
          <option value="all">Todos los Eventos</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>{event.name}</option>
          ))}
        </select>
        {currentEventId !== 'all' && (
          <button
            type="button"
            onClick={() => handleEvent('all')}
            className="flex-shrink-0 w-8 h-8 rounded-lg bg-orange-100 hover:bg-red-100 text-[#C64928] hover:text-red-600 font-black text-sm transition-colors flex items-center justify-center border border-orange-200"
            title="Quitar filtro"
          >
            ✕
          </button>
        )}
      </div>

      {/* Selector de Categoría — controlado */}
      <div className="w-full md:w-1/4">
        <select
          className={`w-full p-4 rounded-xl border-2 font-bold focus:outline-none shadow-sm appearance-none cursor-pointer transition-colors ${
            currentCategory !== 'Todas'
              ? 'border-slate-600 bg-slate-50 text-slate-700'
              : 'border-gray-200 bg-white text-gray-900 focus:border-[#C64928]'
          }`}
          value={currentCategory}
          onChange={(e) => handleCategory(e.target.value)}
        >
          <option value="Todas">Todas las Categorías</option>
          {Object.entries(CATEGORY_GROUPS).map(([groupName, categories]) => (
            <optgroup key={groupName} label={groupName.toUpperCase()}>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
      </div>
    </div>
  );
}