import { supabase } from '@/lib/supabase';
import { Teko, Montserrat } from "next/font/google";
import Link from 'next/link';
import { Event } from '@/lib/definitions';

// --- FUENTES ---
const teko = Teko({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "800", "900"], variable: '--font-montserrat' });

// --- CONFIGURACIÓN ---
export const dynamic = 'force-dynamic';

// --- CLUBES ORGANIZADORES ---
const clubsLogos = [
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/Logo%20PNG-04.png',
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/chaski.png',
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/tmtclub.png',
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/cobraclub.png',
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/condores.png',
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/iquiquebikepng.png', 
  'https://xfawvzaapepnxcraliat.supabase.co/storage/v1/object/public/logos/camanchaca.png'
];

// --- TIPOS ---
interface HomeRider {
  rider_id: string;
  full_name: string;
  current_category: string;
  club: string | null;
  club_logo: string | null;
  instagram: string | null;
  total_points: number;
}

export default async function Home() {
  const today = new Date().toISOString().split('T')[0];

  const [top3Response, nextEventResponse] = await Promise.all([
    supabase
      .from('ranking_global')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(3)
      .returns<HomeRider[]>(),

    supabase
      .from('events')
      .select('*')
      .eq('status', 'pending')
      .gte('date', today)
      .order('date', { ascending: true })
      .limit(1)
      .maybeSingle()
  ]);

  const riders = top3Response.data || [];
  const nextEvent = nextEventResponse.data as Event | null;

  const first = riders[0];
  const second = riders[1];
  const third = riders[2];

  return (
    <main className={`min-h-screen bg-[#292725] text-[#EFE6D5] ${montserrat.variable} ${teko.variable} font-sans overflow-x-hidden selection:bg-[#C64928] selection:text-white`}>
      
      {/* ================= HERO SECTION ================= */}
      <header className="relative min-h-[550px] md:min-h-[650px] flex flex-col items-center justify-center text-center px-4 pb-20 rounded-b-[60px] overflow-hidden border-b-[8px] border-[#C64928]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547234935-80c7142ee969?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#292725] via-[#292725]/60 to-black/40"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 mix-blend-overlay"></div>

        <div className="relative z-10 animate-fade-in-up pt-10 flex flex-col items-center w-full max-w-5xl">
          
          {/* Badge Temporada */}
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full mb-6 hover:bg-white/10 transition-colors cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-white font-bold uppercase text-[10px] md:text-xs tracking-[0.2em]">Temporada 2026</span>
          </div>
          
          {/* TÍTULO PRINCIPAL */}
          <h1 className="font-heading text-6xl md:text-9xl uppercase italic leading-none drop-shadow-2xl tracking-tight mb-2 py-2">
            <span className="text-white">CAMPEONATO </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C64928] to-[#8B3A1E] pr-4">MTB</span>
          </h1>
          
          <p className="font-heading text-2xl md:text-4xl text-gray-400 uppercase tracking-[0.2em] mb-10 font-light">
            REGIÓN DE TARAPACÁ
          </p>

          {/* BARRA DE CLUBES */}
          <div className="w-full max-w-5xl mb-12 px-2">
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 opacity-90">
                  {clubsLogos.map((logo, index) => (
                      <div key={index} className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center transition-all duration-500 hover:scale-110 relative">
                          <img 
                              src={logo} 
                              alt={`Club ${index + 1}`} 
                              className="max-w-full max-h-full object-contain" 
                              style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))' }}
                          />
                      </div>
                  ))}
              </div>
          </div>

          <Link href="/ranking" className="group relative inline-flex items-center gap-3 bg-[#C64928] text-white px-10 py-4 rounded-sm font-heading text-3xl uppercase tracking-widest overflow-hidden transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(198,73,40,0.5)]">
             <span className="relative z-10">Ver Ranking Oficial</span>
             <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          </Link>
        </div>
      </header>

      {/* ================= PODIO GENERAL ================= */}
      <section className="relative z-20 -mt-24 max-w-5xl mx-auto px-4">
        <div className="flex justify-center items-end gap-3 md:gap-8 pb-10">
          
          {/* --- 2DO LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center group transition-all duration-500 ${second ? 'opacity-100' : 'opacity-50'}`}>
             <div className="mb-[-20px] z-20 relative transition-transform group-hover:-translate-y-3">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl border-[3px] border-gray-400 bg-[#292725] flex items-center justify-center shadow-[0_0_15px_rgba(192,192,192,0.3)] overflow-hidden">
                    {second?.club_logo ? (
                        <img src={second.club_logo} alt="Club" className="w-full h-full object-contain p-2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' }} />
                    ) : (
                        <span className="font-heading text-5xl md:text-6xl text-gray-400 drop-shadow-md">{second?.full_name[0] || '2'}</span>
                    )}
                </div>
             </div>
             <div className="w-full bg-gradient-to-b from-gray-400 to-gray-600 h-32 md:h-48 rounded-t-xl shadow-2xl flex items-center justify-center relative overflow-hidden border-t border-white/20">
                 <span className="font-heading text-7xl text-black/20 absolute bottom-0">2</span>
             </div>
             <div className="bg-[#34312F] w-full py-4 text-center rounded-b-xl border-b-4 border-gray-400 shadow-lg">
                <p className="font-bold text-xs md:text-sm truncate px-1 uppercase text-white">{second?.full_name.split(' ')[0] || 'Vacante'}</p>
                {second?.club && <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5 truncate px-2">{second.club}</p>}
                <p className="text-[10px] text-gray-400 font-bold mt-1">{second?.total_points || 0} PTS</p>
             </div>
          </div>

          {/* --- 1ER LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center -mb-6 md:-mb-8 z-30 group transition-all duration-500 ${first ? 'opacity-100' : 'opacity-50'}`}>
             <div className="mb-3 z-20 animate-pulse">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12 text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6l2 12h16l2-12-5 4-5-6-5 6z"></path>
                 </svg>
             </div>
             <div className="mb-[-25px] z-20 relative transition-transform group-hover:-translate-y-3">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-[4px] border-[#FFD700] bg-[#292725] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent"></div>
                    {first?.club_logo ? (
                        <img src={first.club_logo} alt="Club" className="w-full h-full object-contain p-2 relative z-10" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }} />
                    ) : (
                        <span className="font-heading text-7xl md:text-8xl text-[#FFD700] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] relative z-10">{first?.full_name[0] || '1'}</span>
                    )}
                </div>
             </div>
             <div className="w-full bg-gradient-to-b from-[#FFD700] to-[#DAA520] h-48 md:h-64 rounded-t-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden border-t border-white/40">
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10"></div>
                 <span className="font-heading text-9xl text-black/10 absolute bottom-0">1</span>
             </div>
             <div className="bg-[#34312F] w-[110%] py-5 text-center rounded-b-xl border-b-4 border-[#FFD700] relative shadow-2xl">
                <p className="font-black text-sm md:text-lg text-white truncate px-2 uppercase">{first?.full_name || 'Líder'}</p>
                <div className="flex flex-col items-center gap-0.5 mt-1">
                    <span className="bg-[#C64928] text-white text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">{first?.current_category || '---'}</span>
                    {first?.club && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{first.club}</span>}
                </div>
                <p className="text-sm font-bold mt-1 text-[#FFD700]">{first?.total_points || 0} PTS</p>
             </div>
          </div>

          {/* --- 3ER LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center group transition-all duration-500 ${third ? 'opacity-100' : 'opacity-50'}`}>
             <div className="mb-[-20px] z-20 relative transition-transform group-hover:-translate-y-3">
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl border-[3px] border-[#CD7F32] bg-[#292725] flex items-center justify-center shadow-[0_0_15px_rgba(205,127,50,0.2)] overflow-hidden">
                    {third?.club_logo ? (
                        <img src={third.club_logo} alt="Club" className="w-full h-full object-contain p-2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' }} />
                    ) : (
                        <span className="font-heading text-5xl md:text-6xl text-[#CD7F32] drop-shadow-md">{third?.full_name[0] || '3'}</span>
                    )}
                </div>
             </div>
             <div className="w-full bg-gradient-to-b from-[#E89C5D] to-[#8B4513] h-24 md:h-40 rounded-t-xl shadow-2xl flex items-center justify-center relative overflow-hidden border-t border-white/20">
                 <span className="font-heading text-7xl text-black/20 absolute bottom-0">3</span>
             </div>
             <div className="bg-[#34312F] w-full py-4 text-center rounded-b-xl border-b-4 border-[#CD7F32] shadow-lg">
                <p className="font-bold text-xs md:text-sm truncate px-1 uppercase text-white">{third?.full_name.split(' ')[0] || 'Vacante'}</p>
                {third?.club && <p className="text-[9px] text-gray-500 uppercase font-bold tracking-wider mt-0.5 truncate px-2">{third.club}</p>}
                <p className="text-[10px] text-gray-400 font-bold">{third?.total_points || 0} PTS</p>
             </div>
          </div>
        </div>
      </section>

      {/* ================= SECCIÓN DINÁMICA: INSCRIPCIÓN (BOTÓN GRANDE) ================= */}
      <section className="py-20 px-4 relative z-30">
        <div className="max-w-xl mx-auto">
            <Link 
              href="/inscripcion"
              className="group relative block bg-[#C64928] hover:bg-[#D85A35] rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(198,73,40,0.4)] border-4 border-white/10 hover:border-white/30 transition-all transform hover:-translate-y-2 cursor-pointer active:scale-95"
            >
                {/* Badge Parpadeante */}
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-md">Abierto</span>
                </div>

                {/* TEXTO */}
                <h2 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none mb-4 drop-shadow-xl group-hover:drop-shadow-2xl transition-all pt-4">
                    {nextEvent ? 'INSCRÍBETE' : 'INSCRIPCIÓN'} <br/>
                    <span className="text-black/20 group-hover:text-black/30 transition-colors">AQUÍ</span>
                </h2>
                
                {/* Caja con Nombre del Evento */}
                <div className="bg-black/20 rounded-xl py-2 px-6 inline-block backdrop-blur-sm border border-white/10 group-hover:bg-black/30 transition-colors">
                  <p className="text-white font-bold text-lg uppercase tracking-wider flex items-center justify-center gap-2">
                    {nextEvent ? nextEvent.name : 'TEMPORADA 2026'} 
                    <span className="text-2xl transition-transform group-hover:translate-x-1">➔</span>
                  </p>
                  
                  {nextEvent && (
                    <p className="text-white/80 text-[10px] font-bold uppercase mt-1">
                       FECHA: {new Date(nextEvent.date + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })}
                    </p>
                  )}
                </div>
            </Link>
        </div>
      </section>

      {/* ================= FOOTER ================= */}
      <footer className="py-10 text-center opacity-40">
          <p className="font-heading text-2xl uppercase text-white tracking-widest">Chaski Riders 2026</p>
      </footer>
    </main>
  );
}