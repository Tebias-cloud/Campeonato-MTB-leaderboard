import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  // Contadores rápidos
  const { count: ridersCount } = await supabase.from('riders').select('*', { count: 'exact', head: true });
  
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
         <div className="relative z-10 max-w-4xl mx-auto flex justify-between items-end">
            <div>
              <p className="text-chaski-gold font-bold uppercase tracking-widest text-xs mb-1">Sistema Admin v2.0</p>
              <h1 className="font-heading text-6xl text-white uppercase italic leading-none">
                Panel <span className="text-chaski-terra">Chaski</span>
              </h1>
            </div>
            <Link href="/ranking" className="bg-white/10 px-4 py-2 rounded-full text-white text-xs font-bold uppercase hover:bg-chaski-terra transition-colors border border-white/5">
              Ir a la Web ↗
            </Link>
         </div>
      </header>

      {/* GRID DE 2 OPCIONES (Riders vs Juez) */}
      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20 grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* 1. GESTIÓN DE RIDERS (Crear/Editar) */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border-l-[12px] border-chaski-terra group hover:-translate-y-2 transition-transform cursor-default relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
          </div>
          
          <div className="flex justify-between items-start mb-6 relative z-10">
             <span className="p-4 bg-chaski-terra/10 text-chaski-terra rounded-2xl text-2xl">👤</span>
             <span className="font-heading text-5xl text-chaski-dark">{ridersCount || 0}</span>
          </div>
          
          <h2 className="font-heading text-4xl uppercase leading-none mb-2 text-chaski-dark">Base de Riders</h2>
          <p className="text-sm text-gray-500 font-bold mb-8">Inscribir nuevos corredores o editar datos personales.</p>
          
          <div className="grid gap-3">
             <Link href="/admin/riders/new" className="block w-full bg-chaski-dark text-white text-center py-4 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-chaski-terra transition-colors shadow-lg">
               + Nuevo Rider
             </Link>
             <Link href="/admin/riders" className="block w-full bg-gray-50 text-gray-400 text-center py-4 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-gray-100 hover:text-chaski-dark transition-colors">
               Ver Lista Completa
             </Link>
          </div>
        </div>

        {/* 2. JUEZ VIRTUAL (Cargar Puntos) */}
        <div className="bg-white rounded-[30px] p-8 shadow-xl border-l-[12px] border-chaski-teal group hover:-translate-y-2 transition-transform cursor-default relative overflow-hidden">
          <div className="absolute right-0 top-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-40 w-40" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
          </div>

          <div className="flex justify-between items-start mb-6 relative z-10">
             <span className="p-4 bg-teal-50 text-chaski-teal rounded-2xl text-2xl">🏆</span>
          </div>
          
          <h2 className="font-heading text-4xl uppercase leading-none mb-2 text-chaski-dark">Sumar Puntos</h2>
          <p className="text-sm text-gray-500 font-bold mb-8">
            Cargar resultados de la fecha <span className="text-chaski-teal bg-teal-50 px-1 rounded">{nextEvent?.name || 'actual'}</span>.
          </p>
          
          <Link href="/admin/results" className="block w-full bg-chaski-teal text-white text-center py-4 rounded-xl font-heading text-xl uppercase tracking-wider hover:bg-[#2A6E71] transition-colors shadow-lg shadow-chaski-teal/30">
            Cargar Resultados
          </Link>
          
          <div className="mt-3 text-center">
             <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest">
               El ranking se actualiza automáticamente
             </p>
          </div>
        </div>

      </div>
    </main>
  );
}