import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";
import { Event } from '@/lib/definitions';

// --- FUENTES ---
const teko = Teko({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

// --- CONFIGURACIÓN DE ORGANIZADORES ---
const organizersByDate = [
  { name: 'Team Franklin', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/Logo%20PNG-04.png' },
  { name: 'Club Chaski', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/chaski.png' },
  { name: 'Club TMT', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/tmtclub.png' },
  { name: 'Club Cobra', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/cobraclub.png' },
  { name: 'Los Cóndores', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/condores.png' },
  { name: 'Iquique Bike', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/condores.png' },
  { name: 'Club Camanchaca', logo: 'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/camanchaca.png' }
];

// --- TIPOS ---
interface ResultWithRider {
  rider_id: string;
  points: number;
  category_played: string;
  race_time?: string | null;
  avg_speed?: number | null;
  riders: {
    full_name: string;
    club: string | null;
    club_logo: string | null;
    instagram: string | null;
    sponsor_1: string | null;
    sponsor_2: string | null;
    sponsor_3: string | null;
  } | null;
}

interface GlobalRankingRow {
  rider_id: string;
  full_name: string;
  current_category: string;
  club: string | null;
  club_logo: string | null;
  instagram: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  sponsor_3: string | null;
  total_points: number;
  events_count: number;
}

interface RankingDisplayData {
  rider_id: string;
  full_name: string;
  category_shown: string;
  club: string | null;
  club_logo: string | null;
  instagram: string | null;
  sponsors: string[];
  points_display: number;
  stats_extra: string | null;
  race_time?: string | null;
  avg_speed?: number | null;
}

type Props = {
  searchParams: Promise<{ category?: string; eventId?: string }>;
};

export const dynamic = 'force-dynamic';

export default async function RankingFull(props: Props) {
  const searchParams = await props.searchParams;
  const categoryFilter = searchParams.category || 'Todas';
  const eventIdFilter = searchParams.eventId || 'general';
  const isGeneral = eventIdFilter === 'general';

  // 1. EVENTOS
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true })
    .returns<Event[]>();

  // 2. LÓGICA
  let rankingData: RankingDisplayData[] = [];
  let titleSuffix = "CLASIFICACIÓN GENERAL";
  let currentOrganizer = null; 

  if (isGeneral) {
    let query = supabase
      .from('ranking_global')
      .select('*')
      .order('total_points', { ascending: false });

    if (categoryFilter !== 'Todas') {
      query = query.eq('current_category', categoryFilter);
    }
    
    const { data } = await query.returns<GlobalRankingRow[]>();
    
    rankingData = data?.map(item => ({
      rider_id: item.rider_id,
      full_name: item.full_name,
      category_shown: item.current_category,
      club: item.club,
      club_logo: item.club_logo,
      instagram: item.instagram,
      sponsors: [item.sponsor_1, item.sponsor_2, item.sponsor_3].filter(s => s && s.length > 5) as string[],
      points_display: item.total_points,
      stats_extra: `${item.events_count} Carreras`
    })) || [];

  } else {
    // --- EVENTO ESPECÍFICO ---
    const selectedEvent = events?.find(e => e.id === eventIdFilter);
    
    if (selectedEvent && events) {
        const eventIndex = events.findIndex(e => e.id === selectedEvent.id);
        const roundNumber = eventIndex + 1;
        titleSuffix = `${roundNumber}ª FECHA`; 

        if (eventIndex >= 0 && eventIndex < organizersByDate.length) {
            currentOrganizer = organizersByDate[eventIndex];
        }
    }

    let query = supabase
      .from('results')
      .select(`
        rider_id,
        points,
        category_played,
        race_time,
        avg_speed,
        riders ( full_name, club, club_logo, instagram, sponsor_1, sponsor_2, sponsor_3 )
      `)
      .eq('event_id', eventIdFilter)
      .order('points', { ascending: false });

    if (categoryFilter !== 'Todas') {
      query = query.eq('category_played', categoryFilter);
    }
    
    const { data } = await query;
    const typedData = data as unknown as ResultWithRider[];

    rankingData = typedData?.map((item) => ({
      rider_id: item.rider_id,
      full_name: item.riders?.full_name || 'Desconocido',
      category_shown: item.category_played,
      club: item.riders?.club || null,
      club_logo: item.riders?.club_logo || null,
      instagram: item.riders?.instagram || null,
      sponsors: [item.riders?.sponsor_1, item.riders?.sponsor_2, item.riders?.sponsor_3].filter(s => s && s.length > 5) as string[],
      points_display: item.points,
      stats_extra: null,
      race_time: item.race_time,
      avg_speed: item.avg_speed
    })) || [];
  }

  // --- CATEGORÍAS REALES ---
  const categories = [
    'Todas',
    'Novicios Open', 
    'Elite Open', 
    'Pre Master', 
    'Master A', 
    'Master B', 
    'Master C', 
    'Master D',
    'Novicias Open',
    'Damas Pre Master', 
    'Damas Master A', 
    'Damas Master B', 
    'Damas Master D',
    'Enduro Open Mixto', 
    'E-Bike Open Mixto'
  ];

  const buildUrl = (newCategory?: string, newEventId?: string) => {
      const cat = newCategory || categoryFilter;
      const evt = newEventId || eventIdFilter;
      const params = new URLSearchParams();
      if (cat !== 'Todas') params.set('category', cat);
      if (evt !== 'general') params.set('eventId', evt);
      const queryString = params.toString();
      return queryString ? `/ranking?${queryString}` : '/ranking';
  }

  const hasLogo = !isGeneral && currentOrganizer && currentOrganizer.logo;

  return (
    <div className={`min-h-screen pb-20 overflow-x-hidden bg-[#EFE6D5] text-[#2A221B] ${montserrat.variable} ${teko.variable} font-sans selection:bg-[#C64928] selection:text-white antialiased`}>
      
      {/* HEADER DINÁMICO */}
      <div className={`relative bg-[#1A1816] px-4 rounded-b-[50px] shadow-2xl overflow-hidden border-b-[6px] border-[#C64928] transition-all duration-300 ease-in-out ${
          isGeneral ? 'h-[340px] md:h-[440px]' : 'h-[300px] md:h-[400px]'
      }`}>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547234935-80c7142ee969?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-bottom opacity-30 mix-blend-luminosity grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/95 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40 mix-blend-overlay"></div>
        
        <div className="relative z-10 w-full max-w-5xl mx-auto pt-6 pb-24 flex flex-col items-center h-full justify-start">
            <div className="absolute top-5 left-0 w-full flex justify-start pointer-events-none px-4 md:px-0">
                <Link href="/" className="pointer-events-auto inline-flex items-center gap-2 text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors group">
                    <span className="group-hover:-translate-x-1 transition-transform text-[#C64928]">❮</span> INICIO
                </Link>
            </div>
            
            <div className={`text-center transition-all duration-300 ${isGeneral ? 'mt-8 md:mt-14' : 'mt-4'}`}>
                <h1 className={`font-heading uppercase italic leading-none drop-shadow-2xl tracking-tight px-4 transition-all duration-300 ${
                    isGeneral ? 'text-4xl sm:text-6xl md:text-8xl' : 'text-4xl sm:text-5xl md:text-7xl'
                }`}>
                    <span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">CAMPEONATO </span>
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#ff5e3a] to-[#a02b10] pr-4 drop-shadow-sm inline-block">MTB</span>
                </h1>
                {isGeneral && (
                    <h2 className="font-heading text-[10px] sm:text-sm md:text-xl text-gray-500 uppercase tracking-[0.4em] font-medium animate-fade-in mt-2 md:mt-4">
                        REGIÓN DE TARAPACÁ
                    </h2>
                )}
            </div>

            <div className={`flex flex-col items-center justify-center w-full relative ${isGeneral ? 'mt-4 md:mt-6' : 'mt-2 md:mt-4'}`}>
                {isGeneral && (
                    <div className="relative z-20 animate-fade-in-up mx-auto flex items-center justify-center">
                        <div className="relative px-8 md:px-12 py-1.5 md:py-2">
                            <div className="absolute inset-0 bg-gradient-to-r from-[#C64928] to-[#8B3A1E] transform -skew-x-12 rounded-sm shadow-2xl border-y border-white/20 ring-1 ring-black/30"></div>
                            <span className="relative z-10 font-heading text-lg sm:text-2xl md:text-4xl text-white uppercase tracking-[0.15em] drop-shadow-md">
                                CLASIFICACIÓN GENERAL
                            </span>
                        </div>
                    </div>
                )}

                {!isGeneral && (
                    <>
                        {hasLogo && (
                            <div className="animate-fade-in-up mx-auto z-10">
                                <div className="h-24 w-24 md:h-40 md:w-40 p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 bg-black/70 backdrop-blur-xl flex items-center justify-center shadow-[0_0_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 to-transparent opacity-30"></div>
                                    <img src={currentOrganizer!.logo} alt={currentOrganizer!.name} className="h-full w-full object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.6)]" />
                                </div>
                            </div>
                        )}
                        {!hasLogo && currentOrganizer && (
                            <div className="h-14 md:h-16 px-6 md:px-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl flex items-center justify-center shadow-lg mx-auto z-10">
                                <span className="font-heading text-xl md:text-2xl text-white uppercase tracking-wider">{currentOrganizer.name}</span>
                            </div>
                        )}
                        <div className={`relative z-20 animate-fade-in-up mx-auto flex items-center justify-center ${hasLogo ? 'mt-3' : 'mt-4'}`}>
                            <div className="relative px-6 md:px-8 py-1">
                                <div className="absolute inset-0 bg-gradient-to-r from-[#C64928] to-[#8B3A1E] transform -skew-x-12 rounded-sm shadow-xl border border-white/20 ring-1 ring-black/30"></div>
                                <span className="relative z-10 font-heading text-base md:text-2xl text-white uppercase tracking-widest drop-shadow-md">
                                    {titleSuffix}
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL - DOCK */}
      <div className={`max-w-7xl mx-auto px-2 md:px-4 relative z-30 space-y-5 transition-all duration-300 -mt-14 md:-mt-12`}>
        
        {/* BARRA DE FECHAS */}
        <div className="flex justify-center">
            <div className="bg-[#1A1816]/95 backdrop-blur-md p-1.5 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-white/10 inline-flex flex-col md:flex-row items-center gap-1 max-w-full overflow-hidden">
                <Link href={buildUrl(undefined, 'general')} scroll={false} className={`flex flex-col justify-center items-center px-4 py-1 rounded-[1.6rem] transition-all duration-300 relative z-10 shrink-0 h-14 w-24 group ${eventIdFilter === 'general' ? 'bg-gradient-to-br from-[#C64928] to-[#8B3A1E] text-white shadow-lg scale-105 ring-1 ring-white/20' : 'bg-transparent text-gray-500 hover:text-white hover:bg-white/5 border-r border-white/5 md:border-none'}`}>
                    <span className="text-[8px] font-black uppercase tracking-[0.2em] opacity-80 leading-none mb-0.5 group-hover:opacity-100">Ranking</span>
                    <span className="font-heading text-xl leading-none uppercase drop-shadow-sm">Global</span>
                </Link>
                <div className="w-[1px] h-8 bg-white/10 hidden md:block mx-1"></div>
                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 py-2 w-full md:w-auto">
                    {events?.map((event) => {
                        const dateObj = new Date(event.date + 'T12:00:00');
                        const day = dateObj.toLocaleDateString('es-CL', { day: '2-digit' });
                        const month = dateObj.toLocaleDateString('es-CL', { month: 'short' }).replace('.', '').toUpperCase();
                        const isActive = eventIdFilter === event.id;
                        return (
                        <Link key={event.id} href={buildUrl(undefined, event.id)} scroll={false} className={`shrink-0 flex flex-col items-center justify-center w-12 h-14 rounded-[1.4rem] transition-all duration-300 relative group ${isActive ? 'bg-white text-[#1A1816] shadow-xl transform scale-105 font-bold z-10 ring-4 ring-[#1A1816]' : 'text-gray-500 hover:bg-white/5 hover:text-white'}`}>
                            <span className="text-[8px] font-bold uppercase tracking-widest leading-none mb-0.5 group-hover:text-[#C64928] transition-colors">{month}</span>
                            <span className="font-heading text-2xl leading-none">{day}</span>
                        </Link>
                    )})}
                </div>
            </div>
        </div>

        {/* FILTROS DE CATEGORÍA */}
        <div className="flex justify-center gap-2 flex-wrap px-2 pt-2">
            {categories.map((cat) => {
                let displayName = cat;
                if (cat === 'Novicios Open') displayName = 'Novicios';
                if (cat === 'Novicias Open') displayName = 'Novicias';
                if (cat === 'Elite Open') displayName = 'Elite';
                if (cat === 'Enduro Open Mixto') displayName = 'Enduro';
                if (cat === 'E-Bike Open Mixto') displayName = 'E-Bike';
                displayName = displayName.replace('Damas', 'D.');

                return (
                    <Link key={cat} href={buildUrl(cat, undefined)} scroll={false} className={`px-5 py-1.5 rounded-sm font-bold uppercase text-[10px] md:text-xs tracking-wider shadow-sm transition-all transform -skew-x-12 border ${categoryFilter === cat ? 'bg-[#1A1816] text-white border-[#C64928] border-b-4 scale-105 shadow-md' : 'bg-white text-[#1A1816] border-white hover:border-gray-300 hover:bg-gray-50 hover:-translate-y-0.5'}`}>
                        <span className="skew-x-12 block whitespace-nowrap">{displayName}</span>
                    </Link>
                );
            })}
        </div>

        {/* RESULTADOS LISTA */}
        <div className="max-w-4xl mx-auto px-2 md:px-4 pb-20 relative z-10 pt-2">
            {rankingData.map((rider, index) => {
            const rank = index + 1;
            
            // LÓGICA DE PODIOS MEJORADA (COLORES SÓLIDOS Y CLAROS)
            const isGold = rank === 1;
            const isSilver = rank === 2;
            const isBronze = rank === 3;
            const isPodiumExtended = rank === 4 || rank === 5; 
            const isTop10 = rank >= 6 && rank <= 10;

            const instaLink = rider.instagram 
                ? `https://instagram.com/${rider.instagram.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '')}` 
                : null;

            return (
            <div key={rider.rider_id + index} className={`group relative p-2.5 mb-2 rounded-xl border-l-[6px] transition-all flex items-center gap-3 hover:shadow-xl hover:scale-[1.005] overflow-hidden ${
                // AQUI ESTA EL CAMBIO: Usamos colores SÓLIDOS claros o blanco puro
                isGold ? 'border-[#FFD700] bg-[#FFFBEB]' : // Amarillo muy pálido sólido (no transparente)
                isSilver ? 'border-[#C0C0C0] bg-white' : 
                isBronze ? 'border-[#CD7F32] bg-white' : 
                isPodiumExtended ? 'border-[#C64928] bg-[#FFF7ED]' : // Naranja muy pálido sólido (no transparente)
                isTop10 ? 'border-gray-600 bg-white' : 
                'border-gray-200 bg-white'
            }`}>
                
                <Link href={`/profile/${rider.rider_id}`} className="absolute inset-0 z-10" />

                <div className={`font-heading text-4xl w-10 text-center shrink-0 ${
                    isGold ? 'text-[#FFD700] drop-shadow-sm' : 
                    isSilver ? 'text-gray-400' : 
                    isBronze ? 'text-[#CD7F32]' : 
                    isPodiumExtended ? 'text-[#C64928]' :
                    isTop10 ? 'text-gray-600' :
                    'text-gray-300'
                }`}>
                    #{rank}
                </div>
                
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-heading text-2xl font-bold shrink-0 overflow-hidden shadow-inner bg-gray-50 border border-gray-100 group-hover:border-[#C64928]/20 transition-colors`}>
                    {rider.club_logo ? (
                        <img src={rider.club_logo} alt="Club" className="w-full h-full object-contain p-1.5" />
                    ) : (
                        <span className="text-gray-300">{rider.full_name[0]}</span>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between pr-2 md:pr-6">
                    <div className="flex flex-col justify-center min-w-0 mr-4">
                        <div className="flex items-center gap-2">
                            <h3 className={`font-black text-xs md:text-base uppercase truncate transition-colors leading-tight ${
                                isGold ? 'text-[#1A1816]' : 'text-[#2A221B] group-hover:text-[#C64928]'
                            }`}>
                                {rider.full_name}
                            </h3>
                            {instaLink && (
                                <a href={instaLink} target="_blank" rel="noopener noreferrer" className="relative z-20 text-gray-400 hover:text-[#C13584] transition-colors p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                </a>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5 text-[9px] text-gray-500 font-bold uppercase mt-0.5">
                            <span className="bg-[#EFE6D5] text-[#1A1816] px-1.5 py-0.5 rounded-sm leading-none">{rider.category_shown}</span>
                            {rider.club && <span className="truncate max-w-[120px] hidden md:inline leading-none tracking-wide text-gray-400">• {rider.club}</span>}
                        </div>
                    </div>

                    {!isGeneral && (rider.race_time || rider.avg_speed) && (
                        <div className="hidden sm:flex flex-col items-end shrink-0 gap-0.5">
                            {rider.race_time && (
                                <div className="flex items-center gap-1.5" title="Tiempo">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C64928] mb-0.5">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span className="font-heading text-xl text-[#1A1816] leading-none tracking-wide">{rider.race_time}</span>
                                </div>
                            )}
                            {rider.avg_speed && (
                                <div className="flex items-center gap-1.5" title="Velocidad Promedio">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-0.5">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                    </svg>
                                    <span className="font-heading text-lg text-gray-400 leading-none">{rider.avg_speed} km/h</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="text-right pl-4 shrink-0 self-center">
                    <span className={`block font-heading text-4xl leading-none transition-transform group-hover:scale-110 ${isGold ? 'text-[#C64928]' : 'text-[#1A1816]'}`}>
                        {rider.points_display}
                    </span>
                    <span className="text-[9px] text-gray-400 font-black uppercase tracking-[0.2em] block text-right pr-1">PTS</span>
                </div>
            </div>
            )})}
            
            {rankingData.length === 0 && (
                <div className="text-center py-10 opacity-50">
                    <p className="font-heading text-2xl uppercase text-gray-400">Sin registros</p>
                    <p className="text-xs font-bold uppercase text-gray-500 tracking-widest mt-2">Intenta cambiar los filtros</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}