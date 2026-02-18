'use client';

import { supabase } from '@/lib/supabase';
import { Teko, Montserrat } from "next/font/google";
import Link from 'next/link';
import { Event } from '@/lib/definitions';
import { useEffect, useState } from 'react';

// --- FUENTES ---
const teko = Teko({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "800", "900"], variable: '--font-montserrat' });

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
  category: string;
  club: string | null;
  club_logo: string | null;
  instagram: string | null;
  total_points: number;
}

export default function Home() {
  const [riders, setRiders] = useState<HomeRider[]>([]);
  const [nextEvent, setNextEvent] = useState<Event | null>(null);
  
  // ESTADOS DINÁMICOS
  const [categorias, setCategorias] = useState<string[]>(['General']);
  const [categoriaActual, setCategoriaActual] = useState<string>('General');
  
  // ESTADO DEL TIEMPO (Cuenta regresiva)
  const [timeLeft, setTimeLeft] = useState<number>(7);

  // 1. CARGAR DATOS INICIALES
  useEffect(() => {
    async function loadInitialData() {
      const today = new Date().toISOString().split('T')[0];

      const [eventResponse, categoriesResponse] = await Promise.all([
        supabase.from('events').select('*').eq('status', 'pending').gte('date', today).order('date', { ascending: true }).limit(1).maybeSingle(),
        supabase.from('riders').select('category')
      ]);

      if (eventResponse.data) setNextEvent(eventResponse.data as Event);
      
      if (categoriesResponse.data) {
        const uniqueCategories = Array.from(new Set(categoriesResponse.data.map(r => r.category).filter(Boolean))).sort();
        setCategorias(['General', ...uniqueCategories]);
      }
    }
    loadInitialData();
  }, []);

  // 2. CARGAR RANKING SEGÚN CATEGORÍA
  useEffect(() => {
    async function loadRanking() {
      let query = supabase.from('ranking_global').select('*').order('total_points', { ascending: false }).limit(3);
      if (categoriaActual !== 'General') query = query.eq('category', categoriaActual);
      
      const { data } = await query.returns<HomeRider[]>();
      if (data) setRiders(data);
    }
    loadRanking();
  }, [categoriaActual]);

  // 3. LÓGICA DEL TEMPORIZADOR (1 segundo a la vez)
  useEffect(() => {
    if (categorias.length <= 1) return; // Si solo hay 1 categoría, no rota

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Cuando llega a 0, cambiamos de categoría y reiniciamos a 7
          setCategoriaActual((currentCat) => {
            const currentIndex = categorias.indexOf(currentCat);
            const nextIndex = (currentIndex + 1) % categorias.length;
            return categorias[nextIndex];
          });
          return 7; 
        }
        return prev - 1; // Resta 1 segundo
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [categorias]);

  // Función si el usuario cambia manualmente
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCategoriaActual(e.target.value);
    setTimeLeft(7); // Reinicia el contador si el usuario interactúa
  };

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
          <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-full mb-6 cursor-default">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-white font-bold uppercase text-[10px] md:text-xs tracking-[0.2em]">Temporada 2026</span>
          </div>
          
          <h1 className="font-heading text-6xl md:text-9xl uppercase italic leading-none drop-shadow-2xl tracking-tight mb-2 py-2">
            <span className="text-white">CAMPEONATO </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#C64928] to-[#8B3A1E] pr-4">MTB</span>
          </h1>
          
          <p className="font-heading text-2xl md:text-4xl text-gray-400 uppercase tracking-[0.2em] mb-10 font-light">
            REGIÓN DE TARAPACÁ
          </p>

          <div className="w-full max-w-5xl mb-12 px-2">
              <div className="flex flex-wrap justify-center items-center gap-4 md:gap-8 opacity-90">
                  {clubsLogos.map((logo, index) => (
                      <div key={index} className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center transition-all duration-500 hover:scale-110 relative">
                          <img src={logo} alt={`Club ${index + 1}`} className="max-w-full max-h-full object-contain" style={{ filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.25))' }}/>
                      </div>
                  ))}
              </div>
          </div>

          {/* EL BOTÓN RECUPERADO Y DESTACADO */}
          <Link href="/ranking" className="group relative inline-flex items-center gap-3 bg-[#C64928] text-white px-10 py-4 rounded-sm font-heading text-3xl uppercase tracking-widest overflow-hidden transform hover:scale-105 transition-all shadow-[0_0_20px_rgba(198,73,40,0.5)]">
             <span className="relative z-10">Ver Ranking Oficial</span>
             <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-500"></div>
          </Link>
        </div>
      </header>

      {/* ================= PODIO GENERAL ================= */}
      <section className="relative z-20 -mt-20 max-w-5xl mx-auto px-4">
        
        {/* --- SELECTOR SUTIL (AJUSTADO) --- */}
        <div className="flex flex-col items-center justify-center mb-6 relative z-30 mt-5">
          
          {/* Se aumentó la opacidad base a 70% y se añadió un fondo sutil al hacer hover */}
          <div className="group flex items-center gap-3 opacity-70 hover:opacity-100 transition-all duration-500 cursor-pointer bg-black/20 px-4 py-2 rounded-full hover:bg-black/40 backdrop-blur-sm border border-white/5">
             <svg className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
             </svg>
             
             {/* Select "Invisible" */}
             <div className="relative">
                <select
                  value={categoriaActual}
                  onChange={handleCategoryChange}
                  className="appearance-none bg-transparent text-white text-xs font-bold uppercase tracking-[0.15em] focus:outline-none cursor-pointer text-center py-1 truncate max-w-[150px] md:max-w-none"
                >
                  {categorias.map((cat) => (
                    <option key={cat} value={cat} className="bg-[#292725] text-white">
                      {cat}
                    </option>
                  ))}
                </select>
             </div>

             {/* Indicador de tiempo MÁS NOTORIO (estilo etiqueta) */}
             {categorias.length > 1 && (
               <span className="text-[10px] font-black text-[#C64928] bg-[#C64928]/20 px-2 py-0.5 rounded-md animate-pulse ml-1">{timeLeft}s</span>
             )}
          </div>
        </div>

        {/* --- CAJONES DEL PODIO --- */}
        <div className="flex justify-center items-end gap-3 md:gap-8 pb-10 min-h-[350px]">
          
          {/* --- 2DO LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center group transition-all duration-500 ${second ? 'opacity-100' : 'opacity-0'}`}>
             {second && (
               <>
                 <div className="mb-[-20px] z-20 relative transition-transform group-hover:-translate-y-3">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl border-[3px] border-gray-400 bg-[#292725] flex items-center justify-center shadow-[0_0_15px_rgba(192,192,192,0.3)] overflow-hidden">
                        {second.club_logo ? (
                            <img src={second.club_logo} alt="Club" className="w-full h-full object-contain p-2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' }} />
                        ) : (
                            <span className="font-heading text-5xl md:text-6xl text-gray-400 drop-shadow-md">{second.full_name[0]}</span>
                        )}
                    </div>
                 </div>
                 <div className="w-full bg-gradient-to-b from-gray-400 to-gray-600 h-32 md:h-48 rounded-t-xl shadow-2xl flex items-center justify-center relative overflow-hidden border-t border-white/20">
                     <span className="font-heading text-7xl text-black/20 absolute bottom-0">2</span>
                 </div>
                 <div className="bg-[#34312F] w-full py-4 text-center rounded-b-xl border-b-4 border-gray-400 shadow-lg">
                    <p className="font-bold text-xs md:text-sm truncate px-1 uppercase text-white">{second.full_name.split(' ')[0]}</p>
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                        <span className="bg-gray-500 text-white text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">{second.category}</span>
                        {second.club && <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-1 truncate px-2">{second.club}</span>}
                    </div>
                    <p className="text-[10px] text-gray-300 font-bold mt-1">{second.total_points} PTS</p>
                 </div>
               </>
             )}
          </div>

          {/* --- 1ER LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center -mb-6 md:-mb-8 z-30 group transition-all duration-500 ${first ? 'opacity-100' : 'opacity-0'}`}>
             {first && (
               <>
                 <div className="mb-3 z-20 animate-pulse">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 md:h-12 md:w-12 text-[#FFD700] drop-shadow-[0_0_20px_rgba(255,215,0,0.6)]" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 6l2 12h16l2-12-5 4-5-6-5 6z"></path>
                     </svg>
                 </div>
                 <div className="mb-[-25px] z-20 relative transition-transform group-hover:-translate-y-3">
                    <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl border-[4px] border-[#FFD700] bg-[#292725] flex items-center justify-center shadow-[0_0_30px_rgba(255,215,0,0.4)] overflow-hidden relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-[#FFD700]/10 to-transparent"></div>
                        {first.club_logo ? (
                            <img src={first.club_logo} alt="Club" className="w-full h-full object-contain p-2 relative z-10" style={{ filter: 'drop-shadow(0 0 12px rgba(255,255,255,0.4))' }} />
                        ) : (
                            <span className="font-heading text-7xl md:text-8xl text-[#FFD700] drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] relative z-10">{first.full_name[0]}</span>
                        )}
                    </div>
                 </div>
                 <div className="w-full bg-gradient-to-b from-[#FFD700] to-[#DAA520] h-48 md:h-64 rounded-t-xl shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex items-center justify-center relative overflow-hidden border-t border-white/40">
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diamond-upholstery.png')] opacity-10"></div>
                     <span className="font-heading text-9xl text-black/10 absolute bottom-0">1</span>
                 </div>
                 <div className="bg-[#34312F] w-[110%] py-5 text-center rounded-b-xl border-b-4 border-[#FFD700] relative shadow-2xl">
                    <p className="font-black text-sm md:text-lg text-white truncate px-2 uppercase">{first.full_name}</p>
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                        <span className="bg-[#C64928] text-white text-[9px] px-2 py-0.5 rounded uppercase tracking-wider">{first.category}</span>
                        {first.club && <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">{first.club}</span>}
                    </div>
                    <p className="text-sm font-bold mt-1 text-[#FFD700]">{first.total_points} PTS</p>
                 </div>
               </>
             )}
          </div>

          {/* --- 3ER LUGAR --- */}
          <div className={`w-1/3 flex flex-col items-center group transition-all duration-500 ${third ? 'opacity-100' : 'opacity-0'}`}>
             {third && (
               <>
                 <div className="mb-[-20px] z-20 relative transition-transform group-hover:-translate-y-3">
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl border-[3px] border-[#CD7F32] bg-[#292725] flex items-center justify-center shadow-[0_0_15px_rgba(205,127,50,0.2)] overflow-hidden">
                        {third.club_logo ? (
                            <img src={third.club_logo} alt="Club" className="w-full h-full object-contain p-2" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.35))' }} />
                        ) : (
                            <span className="font-heading text-5xl md:text-6xl text-[#CD7F32] drop-shadow-md">{third.full_name[0]}</span>
                        )}
                    </div>
                 </div>
                 <div className="w-full bg-gradient-to-b from-[#E89C5D] to-[#8B4513] h-24 md:h-40 rounded-t-xl shadow-2xl flex items-center justify-center relative overflow-hidden border-t border-white/20">
                     <span className="font-heading text-7xl text-black/20 absolute bottom-0">3</span>
                 </div>
                 <div className="bg-[#34312F] w-full py-4 text-center rounded-b-xl border-b-4 border-[#CD7F32] shadow-lg">
                    <p className="font-bold text-xs md:text-sm truncate px-1 uppercase text-white">{third.full_name.split(' ')[0]}</p>
                    <div className="flex flex-col items-center gap-0.5 mt-1">
                        <span className="bg-[#8B4513] text-white text-[8px] px-2 py-0.5 rounded uppercase tracking-wider">{third.category}</span>
                        {third.club && <span className="text-[9px] text-gray-400 uppercase font-bold tracking-wider mt-1 truncate px-2">{third.club}</span>}
                    </div>
                    <p className="text-[10px] text-[#CD7F32] font-bold mt-1">{third.total_points} PTS</p>
                 </div>
               </>
             )}
          </div>
        </div>
      </section>

      {/* ================= SECCIÓN DINÁMICA: INSCRIPCIÓN ================= */}
      <section className="py-20 px-4 relative z-30">
        <div className="max-w-xl mx-auto">
            <Link href="/inscripcion" className="group relative block bg-[#C64928] hover:bg-[#D85A35] rounded-3xl p-8 text-center shadow-[0_0_30px_rgba(198,73,40,0.4)] border-4 border-white/10 hover:border-white/30 transition-all transform hover:-translate-y-2 cursor-pointer active:scale-95">
                <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                    <span className="text-white font-black text-[10px] uppercase tracking-widest drop-shadow-md">Abierto</span>
                </div>
                <h2 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none mb-4 drop-shadow-xl group-hover:drop-shadow-2xl transition-all pt-4">
                    {nextEvent ? 'INSCRÍBETE' : 'INSCRIPCIÓN'} <br/>
                    <span className="text-black/20 group-hover:text-black/30 transition-colors">AQUÍ</span>
                </h2>
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

      <footer className="py-10 text-center opacity-40">
          <p className="font-heading text-2xl uppercase text-white tracking-widest">Chaski Riders 2026</p>
      </footer>
    </main>
  );
}