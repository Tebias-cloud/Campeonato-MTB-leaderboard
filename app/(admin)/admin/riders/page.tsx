import { Suspense } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import RiderFilters from '@/components/admin/RiderFilters';
import ExportExcelButton from '@/components/admin/ExportExcelButton';
import RiderDorsalCell from '@/components/admin/RiderDorsalCell';
import { normalizeCategory } from '@/lib/utils';
import MassiveDorsalAssigner from '@/components/admin/MassiveDorsalAssigner';

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: '--font-montserrat' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-mono' });

export const dynamic = 'force-dynamic';

export default async function RidersListPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string; eventId?: string }>;
}) {
  const params = await searchParams;
  const queryText = params.query || '';
  const categoryFilter = params.category || '';
  const eventIdFilter = params.eventId || 'all';

  // 1. Obtener Eventos
  const { data: events } = await supabase.from('events').select('id, name, date').order('date', { ascending: false });

  // 2. Query Principal de Riders
  let query = supabase.from('riders').select('*').order('full_name', { ascending: true });
  if (queryText) query = query.or(`full_name.ilike.%${queryText}%,club.ilike.%${queryText}%,rut.ilike.%${queryText}%`);
  if (categoryFilter && categoryFilter !== 'Todas') {
    const baseCategory = categoryFilter.split(' (')[0];
    query = query.ilike('category', `${baseCategory}%`);
  }

  // Filtro por Evento (vía participaciones reales)
  if (eventIdFilter !== 'all') {
    const { data: participations } = await supabase.from('event_riders').select('rider_id').eq('event_id', eventIdFilter);
    const riderIds = (participations || []).map(p => p.rider_id);
    query = query.in('id', riderIds.length > 0 ? riderIds : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: ridersData } = await query;
  const riders = ridersData || [];

  // 3. Cargar Participaciones Reales del set actual (usando event_riders que es la verdad)
  const riderIds = riders.map(r => r.id);
  const { data: participations } = riderIds.length > 0 ? 
    await supabase.from('event_riders').select('rider_id, event_id').in('rider_id', riderIds) : 
    { data: [] };

  // Manual join para eventos para evitar errores de cache
  const eventIds = Array.from(new Set((participations || []).map(p => p.event_id)));
  const { data: eventsData } = eventIds.length > 0 ? 
    await supabase.from('events').select('id, name, date').in('id', eventIds).order('date', { ascending: true }) : 
    { data: [] };
  const eventNamesMap = new Map((eventsData || []).map(e => [e.id, e.name]));

  const [dorsalsRes] = await Promise.all([
    eventIdFilter !== 'all' ? 
      supabase.from('event_riders').select('rider_id, dorsal, category_at_event, club_at_event').eq('event_id', eventIdFilter) : 
      Promise.resolve({ data: [] })
  ]);

  // 4. Mapear datos finales
  const finalizedRiders = riders.map(rider => {
    const historical = (dorsalsRes.data || []).find((d: any) => d.rider_id === rider.id);
    return {
      ...rider,
      // Priorizamos los datos congelados si estamos filtrando por evento
      display_category: historical?.category_at_event || rider.category,
      display_club: historical?.club_at_event || rider.club,
      current_dorsal: historical?.dorsal || null,
      // Nueva lista de participaciones
      participation_list: (participations || []).filter((p: any) => p.rider_id === rider.id)
    };
  });

  const getEventsDisplay = (riderId: string, participations: any[]) => {
    const riderEventIds = new Set(participations.filter(p => p.rider_id === riderId).map(p => p.event_id));
    return (eventsData || [])
      .filter(e => riderEventIds.has(e.id))
      .map(e => e.name);
  };

  // --- LÓGICA DE EXPORTACIÓN ---
  // Usamos ISO para evitar discrepancias de zona horaria entre servidor y cliente (Hydration Error)
  const fechaHoy = new Date().toISOString().split('T')[0];
  const matchingEvent = events?.find(e => e.id.toString() === eventIdFilter.toString());
  
  // Debug para ver si los dorsales llegan al servidor
  if (eventIdFilter !== 'all') {
    console.log(`[RidersPage] Filtrando por evento ${eventIdFilter}. Dorsales encontrados:`, dorsalsRes.data?.filter(d => d.dorsal).length);
  }
  // 1. DATA PARA EXCEL GENERAL (Todo)
  const generalExportData = finalizedRiders.map(r => {
    const row: any = {};
    if (eventIdFilter !== 'all') {
      row['Dorsal'] = r.current_dorsal || 'S/D';
    }
    return {
      ...row,
      'RUT': r.rut,
      'Corredor': r.full_name,
      'Categoría': normalizeCategory(r.display_category),
      'Club / Team': r.display_club || 'INDEPENDIENTE',
      'Email': r.email || '-',
      'Teléfono': r.phone || '-',
      'Ubicación': r.ciudad || '-',
      'F. Nacimiento': r.birth_date || '-',
      'Instagram': r.instagram || '-',
      'Eventos': getEventsDisplay(r.id, participations || []).join(', ')
    };
  });

  // 2. DATA PARA RACETIME (Basado en documentación oficial: RESERVED ENGLISH WORDS)
  const raceTimeExportData = finalizedRiders.map(r => ({
    'BIB': r.current_dorsal || '',
    'NAME': r.full_name,
    'CATEGORY': normalizeCategory(r.display_category),
    'TEAM': r.display_club || 'INDEPENDIENTE',
    'BIRTHDATE': r.birth_date ? r.birth_date.split('T')[0] : ''
  }));

  const nombreGeneral = `Riders_${eventIdFilter !== 'all' ? matchingEvent?.name : 'General'}_${fechaHoy}`;
  const nombreRaceTime = `RaceTime_${eventIdFilter !== 'all' ? matchingEvent?.name : 'General'}_${fechaHoy}`;

  return (
    <main suppressHydrationWarning className={`min-h-screen bg-[#EFE6D5] text-[#1A1816] ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans pb-32`}>
      
      {/* HEADER */}
      <header className="bg-[#1A1816] pt-12 pb-24 px-6 rounded-b-[50px] shadow-2xl border-b-[8px] border-[#C64928]">
        <div className="max-w-[95rem] mx-auto flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <Link href="/admin" className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">← VOLVER AL PANEL</Link>
            <h1 className="font-heading text-6xl md:text-7xl text-white uppercase italic leading-none tracking-tighter">BASE DE <span className="text-[#C64928]">RIDERS</span></h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Corredores Registrados • {finalizedRiders.length}</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            {/* Banner dinámico */}
            {eventIdFilter !== 'all' ? (
              <div className="bg-green-500/20 border border-green-400/40 px-4 py-2 rounded-xl text-[11px] font-bold text-green-300 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse flex-shrink-0"/>
                Evento activo: <span className="text-white">{matchingEvent?.name}</span> — Dorsales y RaceTime disponibles
              </div>
            ) : (
              <div className="bg-amber-500/15 border border-amber-400/30 px-4 py-2 rounded-xl text-[11px] font-bold text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"/>
                Selecciona una fecha para habilitar Dorsales y RaceTime
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 items-end">
              {eventIdFilter !== 'all' && <MassiveDorsalAssigner eventId={eventIdFilter} />}
              {finalizedRiders.length > 0 && (
                <ExportExcelButton data={generalExportData} fileName={nombreGeneral} label="EXPORTAR EXCEL" />
              )}
              {finalizedRiders.length > 0 && (
                eventIdFilter !== 'all' ? (
                  <ExportExcelButton data={raceTimeExportData} fileName={nombreRaceTime} label="PARA RACETIME" format="csv" />
                ) : (
                  <div className="relative group">
                    <button disabled className="bg-slate-600/40 text-slate-500 px-6 py-3 rounded-2xl font-heading text-lg uppercase italic cursor-not-allowed border border-slate-600/30">
                      PARA RACETIME
                    </button>
                    <div className="absolute bottom-full right-0 mb-2 w-60 bg-[#1A1816] text-white text-[10px] font-bold px-3 py-2 rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center border border-white/10">
                      Filtra por una fecha específica para exportar dorsales a RaceTime
                    </div>
                  </div>
                )
              )}
              <Link href="/admin/riders/new" className="bg-[#C64928] text-white px-8 py-3 rounded-2xl font-heading text-2xl uppercase italic shadow-lg flex items-center justify-center">+ NUEVO RIDER</Link>
            </div>
          </div>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-[95rem] mx-auto px-4 -mt-12 space-y-6">
        
        {/* FILTROS */}
        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100">
           <Suspense fallback={<div className="h-10 animate-pulse bg-gray-100 rounded w-full"/>}>
             <RiderFilters events={events || []} />
           </Suspense>
        </div>

        {/* BANNER INSTRUCTIVO — visible solo sin evento seleccionado */}
        {eventIdFilter === 'all' && (
          <div className="bg-[#1A1816] border border-white/10 rounded-2xl p-5 flex items-start gap-4">
            <div className="w-8 h-8 rounded-xl bg-[#C64928]/20 border border-[#C64928]/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-[#C64928]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="font-black text-white text-sm uppercase tracking-wide">Asignación de Dorsales — Flujo de trabajo</p>
              <ol className="text-slate-400 text-xs font-medium mt-2 space-y-1 list-none">
                <li><span className="text-slate-200 font-black">1.</span> Selecciona una Fecha en el filtro superior — aparecerá la columna Dorsal en la tabla.</li>
                <li><span className="text-slate-200 font-black">2.</span> Edita cada dorsal directamente en la tabla, o usa <strong className="text-slate-200">Asignación en Bloque</strong> para asignar correlativos por categoría de un golpe.</li>
                <li><span className="text-slate-200 font-black">3.</span> Con los dorsales asignados, exporta con <strong className="text-slate-200">PARA RACETIME</strong> el CSV listo para importar al cronómetro.</li>
              </ol>
            </div>
          </div>
        )}

        {/* TABLA - VOLVIENDO A LAS BASES */}
        <div className="bg-white border-2 border-slate-200 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[1200px]" suppressHydrationWarning>
              <thead className="bg-[#1A1816] text-[#EFE6D5] text-[10px] font-black uppercase tracking-widest border-b-4 border-[#C64928]">
                <tr>
                  <th className="px-6 py-5">RUT</th>
                  <th className="px-6 py-5 min-w-[250px]">CORREDOR</th>
                  <th className="px-6 py-5">CATEGORÍA</th>
                  {eventIdFilter !== 'all' && <th className="px-6 py-5 text-center text-[#C64928]">DORSAL</th>}
                  <th className="px-6 py-5">EVENTOS</th>
                  <th className="px-6 py-5">CLUB / TEAM</th>
                  <th className="px-6 py-5">UBICACIÓN</th>
                  <th className="px-6 py-5">NACIMIENTO</th>
                  <th className="px-6 py-5 text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100" suppressHydrationWarning>
                {finalizedRiders.map((rider) => (
                  <tr key={rider.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#C64928] text-xs whitespace-nowrap">{rider.rut}</td>
                    <td className="px-6 py-4">
                      <div className="font-black text-[#1A1816] uppercase text-sm leading-tight">{rider.full_name}</div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold lowercase">{rider.email || '-'}</span>
                        <div className="flex items-center gap-2">
                          {rider.phone && <span className="text-[9px] text-slate-500 font-bold">📞 {rider.phone}</span>}
                          {rider.instagram && (
                             <span className="text-[9px] text-pink-600 font-black italic">
                               @{(rider.instagram).replace('@', '')}
                             </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                       <span className="bg-[#FFD700]/20 text-[#1A1816] px-2 py-1 rounded text-[10px] font-black uppercase border border-[#FFD700]/30">
                         {normalizeCategory(rider.display_category)}
                       </span>
                    </td>
                    {eventIdFilter !== 'all' && (
                      <td className="px-6 py-4 text-center">
                        <RiderDorsalCell riderId={rider.id} eventId={eventIdFilter!} initialDorsal={rider.current_dorsal} />
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {getEventsDisplay(rider.id, participations || []).map((name: string, i: number) => (
                           <span key={i} className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200">{name}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black italic uppercase text-[#C64928] text-xs">{rider.display_club || 'Independiente'}</td>
                    <td className="px-6 py-4 text-xs font-bold uppercase text-slate-700">{rider.ciudad || '-'}</td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-slate-400">
                      {rider.birth_date ? rider.birth_date.split('T')[0] : '-'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Link href={`/admin/riders/${rider.id}`} className="bg-[#1A1816] text-[#EFE6D5] px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-[#C64928] transition-all inline-block">EDITAR</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}