import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Contadores rápidos
  const { count: ridersCount } = await supabase.from('riders').select('*', { count: 'exact', head: true });
  
  // Contador de solicitudes pendientes
  const { count: pendingCount } = await supabase
    .from('registration_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');
  
  // Obtenemos el próximo evento para mostrarlo en el botón de Juez
  const today = new Date().toISOString().split('T')[0];
  const { data: nextEvent } = await supabase
    .from('events')
    .select('name')
    .eq('status', 'pending')
    .gte('date', today)
    .order('date', { ascending: true })
    .limit(1)
    .single();

  return (
    <main className={`min-h-screen bg-chaski-sand text-chaski-dark ${montserrat.variable} ${teko.variable} font-sans pb-32`}>
      
      {/* HEADER SIMPLIFICADO */}
      <header className="bg-[#1A1816] pt-12 pb-24 px-6 rounded-b-[50px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10 max-w-6xl mx-auto flex justify-between items-end">
            <div>
              <p className="text-chaski-gold font-bold uppercase tracking-widest text-xs mb-1"></p>
              <h1 className="font-heading text-6xl text-white uppercase italic leading-none">
                Panel <span className="text-chaski-terra">Admin</span>
              </h1>
            </div>
            <Link href="/ranking" className="bg-white/10 px-4 py-2 rounded-full text-white text-xs font-bold uppercase hover:bg-chaski-terra transition-colors border border-white/5">
              Ir a la Web ↗
            </Link>
          </div>
      </header>

      {/* GRID DE 3 OPCIONES (Solicitudes, Riders, Juez) */}
      <div className="max-w-6xl mx-auto px-4 -mt-16 relative z-20 grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* 1. GESTIÓN DE SOLICITUDES (Nueva) */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border-t-[12px] border-[#C64928] group hover:-translate-y-2 transition-transform relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
             <span className="p-4 bg-orange-50 text-[#C64928] rounded-2xl text-2xl">📩</span>
             <div className="flex flex-col items-end">
                <span className="font-heading text-5xl text-chaski-dark">{pendingCount || 0}</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Pendientes</span>
             </div>
          </div>
          
          <h2 className="font-heading text-4xl uppercase leading-none mb-2 text-chaski-dark">Inscripciones</h2>
          <p className="text-sm text-gray-500 font-bold mb-8">Validar solicitudes de inscripción.</p>
          
          <Link href="/admin/solicitudes" className="block w-full bg-[#1A1816] text-white text-center py-4 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-[#C64928] transition-all shadow-lg shadow-orange-900/20">
             Revisar Solicitudes
          </Link>
        </div>

        {/* 2. GESTIÓN DE RIDERS */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border-t-[12px] border-chaski-terra group hover:-translate-y-2 transition-transform relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
             <span className="p-4 bg-chaski-terra/10 text-chaski-terra rounded-2xl text-2xl">👤</span>
             <div className="flex flex-col items-end">
                <span className="font-heading text-5xl text-chaski-dark">{ridersCount || 0}</span>
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Corredores</span>
             </div>
          </div>
          
          <h2 className="font-heading text-4xl uppercase leading-none mb-2 text-chaski-dark">Base de Riders</h2>
          <p className="text-sm text-gray-500 font-bold mb-8">Gestionar datos maestros y lista de corredores históricos.</p>
          
          <div className="grid gap-2">
            <Link href="/admin/riders" className="block w-full bg-chaski-terra text-white text-center py-3 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-chaski-dark transition-colors">
                Administrar Riders
            </Link>
            <Link href="/admin/riders/new" className="block w-full border-2 border-dashed border-slate-200 text-slate-400 text-center py-2 rounded-xl font-heading text-lg uppercase hover:border-chaski-terra hover:text-chaski-terra transition-colors">
                + Crear Manual
            </Link>
          </div>
        </div>

        {/* 3. JUEZ VIRTUAL (Resultados) */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border-t-[12px] border-chaski-teal group hover:-translate-y-2 transition-transform relative overflow-hidden">
          <div className="flex justify-between items-start mb-6 relative z-10">
             <span className="p-4 bg-teal-50 text-chaski-teal rounded-2xl text-2xl">🏆</span>
          </div>
          
          <h2 className="font-heading text-4xl uppercase leading-none mb-2 text-chaski-dark">Sumar Puntos</h2>
          <p className="text-sm text-gray-500 font-bold mb-8">
            Cargar resultados para <span className="text-chaski-teal bg-teal-50 px-1 rounded font-black italic">{nextEvent?.name || 'la fecha actual'}</span>.
          </p>
          
          <Link href="/admin/results" className="block w-full bg-chaski-teal text-white text-center py-4 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-[#2A6E71] transition-all shadow-lg shadow-chaski-teal/30">
            Cargar Resultados
          </Link>
          
          <div className="mt-4 text-center">
             <p className="text-[9px] text-gray-400 uppercase font-black tracking-widest leading-tight">
               El ranking se recalcula al instante <br/> tras guardar resultados
             </p>
          </div>
        </div>

      </div>
    </main>
  );
}