import { supabase } from '@/lib/supabase';
import { Teko, Montserrat } from "next/font/google";
import Link from 'next/link';

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
interface ResultHistory {
  event_id: string;
  points: number;
  position: number;
  category_played: string;
  race_time: string | null;
  avg_speed: number | null;
  created_at: string;
  events: { name: string; date: string } | { name: string; date: string }[] | null;
}

interface EventSimple {
    id: string;
    date: string;
}

export const dynamic = 'force-dynamic';

export default async function RiderProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // 1. Fetch
  const [riderResponse, allEventsResponse] = await Promise.all([
    supabase.from('riders').select('*').eq('id', id).single(),
    supabase.from('events').select('id, date').order('date', { ascending: true }).returns<EventSimple[]>()
  ]);

  const rider = riderResponse.data;
  const allEvents = allEventsResponse.data || [];

  if (!rider) return <div className="min-h-screen flex items-center justify-center text-gray-500 bg-[#1A1816] font-sans">Rider no encontrado</div>;

  // 2. Historial
  const { data: results } = await supabase
    .from('results')
    .select('event_id, points, position, category_played, race_time, avg_speed, created_at, events(name, date)')
    .eq('rider_id', id)
    .order('created_at', { ascending: false })
    .returns<ResultHistory[]>();

  // 3. Stats
  const wins = results?.filter(r => r.position === 1).length || 0;
  const podiums = results?.filter(r => r.position <= 3).length || 0;
  const bestScore = results?.reduce((max, r) => r.points > max ? r.points : max, 0) || 0;
  
  const isChampion = wins > 0;
  
  const instagramHandle = rider.instagram 
    ? rider.instagram.replace('@', '').replace(/https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '') 
    : null;
  
  const instaLink = instagramHandle ? `https://instagram.com/${instagramHandle}` : null;

  return (
    <main className={`min-h-screen bg-[#EFE6D5] text-[#2A221B] ${montserrat.variable} ${teko.variable} font-sans selection:bg-[#C64928] selection:text-white`}>
      
      {/* ================= HEADER ================= */}
      <header className="relative h-[380px] md:h-[460px] bg-[#1A1816] px-4 rounded-b-[50px] shadow-2xl overflow-hidden border-b-[6px] border-[#C64928]">
        {/* Fondos */}
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547234935-80c7142ee969?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-bottom opacity-30 mix-blend-luminosity grayscale"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/95 to-transparent"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-40 mix-blend-overlay"></div>

        <div className="relative z-10 w-full max-w-5xl mx-auto pt-6 flex flex-col items-center h-full justify-between pb-24">
            {/* Nav */}
            <div className="w-full flex justify-start px-2 md:px-0">
                <Link href="/ranking" className="inline-flex items-center gap-2 text-[10px] text-gray-400 hover:text-white font-bold uppercase tracking-[0.2em] transition-colors group">
                    <span className="group-hover:-translate-x-1 transition-transform text-[#C64928]">❮</span> VOLVER
                </Link>
            </div>

            {/* Info Central */}
            <div className="flex flex-col items-center w-full mt-4">
                <div className="mb-4">
                    <span className="inline-block bg-[#C64928] text-white text-[10px] md:text-xs font-black uppercase px-4 py-1 rounded-sm tracking-widest shadow-lg transform -skew-x-12">
                        <span className="block skew-x-12">{rider.current_category || rider.category || 'Rider'}</span>
                    </span>
                </div>

                <h1 className={`font-heading text-center uppercase italic leading-none drop-shadow-2xl tracking-tight px-4 transition-colors duration-300 ${
                    isChampion ? 'text-[#FFD700]' : 'text-white'
                } text-5xl md:text-8xl`}>
                    {rider.full_name}
                </h1>

                <div className="flex flex-wrap justify-center items-center gap-4 mt-6">
                    {rider.club && (
                        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
                            {rider.club_logo && (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={rider.club_logo} alt="Club" className="w-5 h-5 object-contain" />
                            )}
                            <span className="text-[10px] md:text-xs font-bold text-gray-300 uppercase tracking-widest">
                                {rider.club}
                            </span>
                        </div>
                    )}
                    
                    {instaLink && (
                        <a 
                            href={instaLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-[#C13584]/50 transition-all group"
                        >
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-[#C13584] transition-colors" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                            </svg>
                            <span className="text-[10px] md:text-xs font-bold text-gray-400 group-hover:text-white tracking-widest transition-colors lowercase">
                                @{instagramHandle}
                            </span>
                        </a>
                    )}
                </div>
            </div>
            <div className="h-4"></div>
        </div>
      </header>

      {/* ================= STATS ================= */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-3 gap-3 md:gap-6">
            <div className={`bg-[#1A1816] p-4 md:p-6 rounded-xl border-t-4 shadow-2xl text-center flex flex-col items-center justify-center ${isChampion ? 'border-[#FFD700]' : 'border-[#C64928]'}`}>
                <span className={`font-heading text-4xl md:text-6xl leading-none ${isChampion ? 'text-[#FFD700]' : 'text-white'}`}>{wins}</span>
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em] mt-1">Victorias</span>
            </div>
            <div className="bg-[#1A1816] p-4 md:p-6 rounded-xl border-t-4 border-gray-400 shadow-2xl text-center flex flex-col items-center justify-center">
                <span className="font-heading text-4xl md:text-6xl leading-none text-white">{podiums}</span>
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em] mt-1">Podios</span>
            </div>
            <div className="bg-[#1A1816] p-4 md:p-6 rounded-xl border-t-4 border-[#C64928] shadow-2xl text-center flex flex-col items-center justify-center">
                <span className="font-heading text-4xl md:text-6xl leading-none text-white">{bestScore}</span>
                <span className="text-[8px] md:text-[10px] font-bold uppercase text-gray-500 tracking-[0.2em] mt-1">Mejor Pts</span>
            </div>
        </div>
      </div>

      {/* ================= HISTORIAL DE CARRERAS ================= */}
      <div className="max-w-4xl mx-auto px-4 mt-8 pb-20">
          
          <div className="flex items-center gap-4 mb-6 opacity-50">
             <div className="h-[1px] bg-black flex-1"></div>
             <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] text-[#1A1816]">Historial 2026</span>
             <div className="h-[1px] bg-black flex-1"></div>
          </div>

          <div className="space-y-3">
            {results?.map((res, i) => {
                const eventData = Array.isArray(res.events) ? res.events[0] : res.events;
                const eventName = eventData?.name || 'Evento';
                const eventDate = eventData?.date;
                
                const eventIndex = allEvents.findIndex(e => e.id === res.event_id);
                const organizer = eventIndex >= 0 ? organizersByDate[eventIndex] : null;
                const logoUrl = organizer?.logo;

                const isWin = res.position === 1;
                const isPodium = res.position <= 3;

                return (
                <div key={i} className={`group bg-white p-3 md:p-4 rounded-xl border-l-[6px] shadow-sm flex items-center justify-between transition-all hover:scale-[1.01] hover:shadow-md ${
                    isWin ? 'border-[#FFD700]' : 
                    isPodium ? 'border-gray-400' : 
                    'border-[#1A1816]'
                }`}>
                    
                    {/* IZQUIERDA: Posición, Logo, Nombre (FLEX-1 PARA EMPUJAR LO DEMÁS) */}
                    <div className="flex items-center gap-3 md:gap-5 min-w-0 flex-1">
                        
                        {/* 1. Posición */}
                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center font-heading text-xl md:text-3xl shrink-0 ${
                            isWin ? 'bg-[#FFD700] text-[#1A1816]' : 
                            isPodium ? 'bg-gray-200 text-[#1A1816]' : 
                            'bg-gray-100 text-gray-400'
                        }`}>
                            {res.position}º
                        </div>

                        {/* 2. Logo */}
                        <div className="w-12 h-12 md:w-14 md:h-14 shrink-0 rounded-lg bg-gray-50 flex items-center justify-center p-1 border border-gray-100 shadow-inner">
                            {logoUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={logoUrl} alt="Org" className="w-full h-full object-contain" />
                            ) : (
                                <span className="text-[10px] text-gray-300 font-bold uppercase">Org</span>
                            )}
                        </div>

                        {/* 3. Datos del Evento */}
                        <div className="flex flex-col min-w-0">
                            <span className="font-black text-xs md:text-base uppercase text-[#1A1816] leading-tight truncate">
                                {eventName}
                            </span>
                            
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">
                                    {eventDate ? new Date(eventDate + 'T12:00:00').toLocaleDateString('es-CL', { month: 'short', day: 'numeric' }) : '-'}
                                </span>
                                <span className="bg-[#EFE6D5] px-1.5 py-0.5 rounded text-[8px] font-bold uppercase text-[#1A1816] tracking-wider truncate">
                                    {res.category_played}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* CENTRO/DERECHA: Datos Técnicos (Tiempo y Velocidad) */}
                    {/* Al tener flex-1 la izquierda, esto se empuja a la derecha, pegado a los puntos */}
                    {(res.race_time || res.avg_speed) && (
                        <div className="flex flex-col items-end justify-center shrink-0 mr-3 md:mr-6 gap-0.5 border-r border-gray-100 pr-3 md:pr-6 h-10">
                            {res.race_time && (
                                <div className="flex items-center gap-1" title="Tiempo de Carrera">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#C64928] mb-0.5">
                                        <circle cx="12" cy="12" r="10"></circle>
                                        <polyline points="12 6 12 12 16 14"></polyline>
                                    </svg>
                                    <span className="font-heading text-lg md:text-2xl text-[#1A1816] leading-none tracking-wide">
                                        {res.race_time}
                                    </span>
                                </div>
                            )}
                            {res.avg_speed && (
                                <div className="flex items-center gap-1" title="Velocidad Promedio">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 mb-0.5">
                                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path>
                                    </svg>
                                    <span className="font-heading text-base md:text-xl text-gray-400 leading-none">
                                        {res.avg_speed} km/h
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DERECHA FINAL: Puntos */}
                    <div className="text-right pl-2 shrink-0 self-center">
                        <span className={`block font-heading text-3xl md:text-4xl leading-none ${isWin ? 'text-[#C64928]' : 'text-[#1A1816]'}`}>
                            {res.points}
                        </span>
                        <span className="text-[7px] md:text-[8px] block font-black text-gray-300 uppercase tracking-[0.2em] mr-0.5">
                            PTS
                        </span>
                    </div>
                </div>
                )})}

                {(!results || results.length === 0) && (
                    <div className="text-center py-12 opacity-40">
                        <p className="font-heading text-2xl uppercase text-gray-400">Sin carreras</p>
                    </div>
                )}
          </div>
      </div>
    </main>
  );
}