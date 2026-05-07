import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const today = new Date().toISOString().split('T')[0];

  const [
    { count: ridersCount },
    { count: pendingCount },
    { data: nextEvent },
    { data: events },
  ] = await Promise.all([
    supabase.from('riders').select('*', { count: 'exact', head: true }),
    supabase.from('registration_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('events').select('id, name, date, status').gte('date', today).in('status', ['pending', 'active', 'scheduled']).order('date', { ascending: true }).limit(1).maybeSingle(),
    supabase.from('events').select('id, name, date, status').order('date', { ascending: true }),
  ]);

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });
  const daysUntil = nextEvent ? Math.ceil((new Date(nextEvent.date + 'T12:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null;

  return (
    <main className={`min-h-screen bg-[#F0EBE3] text-[#1A1816] ${montserrat.variable} ${teko.variable} font-sans pb-32`}>

      {/* HEADER */}
      <header className="bg-[#1A1816] pt-10 pb-28 px-6 rounded-b-[50px] shadow-2xl">
        <div className="max-w-5xl mx-auto flex justify-between items-end">
          <div>
            <p className="text-[#FFD700] font-black text-[10px] uppercase tracking-[0.3em] mb-1">Sistema de Gestión</p>
            <h1 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none">
              Panel <span className="text-[#C64928]">Admin</span>
            </h1>
          </div>
          <Link href="/ranking" className="text-slate-400 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors">
            Ver Web Pública ↗
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20 space-y-6">

        {/* PRÓXIMO EVENTO — Banner principal */}
        {nextEvent ? (
          <div className="bg-[#1A1816] rounded-3xl p-6 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Próxima Fecha</p>
              <p className="text-white font-black text-xl">{nextEvent.name}</p>
              <p className="text-slate-400 text-sm font-bold mt-0.5">{formatDate(nextEvent.date)}{daysUntil !== null && daysUntil >= 0 && ` — en ${daysUntil} día${daysUntil !== 1 ? 's' : ''}`}</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href={`/admin/riders?eventId=${nextEvent.id}`}
                className="bg-[#C64928] text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-[#a02b10] transition-colors">
                Asignar Dorsales
              </Link>
              <Link href="/admin/results"
                className="bg-white/10 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide hover:bg-white/20 transition-colors border border-white/10">
                Cargar Resultados
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-[#1A1816] rounded-3xl p-6 border border-white/10">
            <p className="text-slate-400 font-bold text-sm">No hay fechas próximas programadas.</p>
          </div>
        )}

        {/* ACCIONES PRINCIPALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Solicitudes */}
          <Link href="/admin/solicitudes" className="group bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#C64928]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              {(pendingCount || 0) > 0 && (
                <span className="bg-[#C64928] text-white text-xs font-black px-2.5 py-1 rounded-full">
                  {pendingCount} nueva{(pendingCount || 0) !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <h2 className="font-black text-[#1A1816] text-lg uppercase tracking-tight">Solicitudes</h2>
            <p className="text-slate-400 text-xs font-bold mt-1 leading-relaxed">Revisar y aprobar inscripciones pendientes de nuevos corredores.</p>
            <div className="mt-4 text-[#C64928] font-black text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              Revisar →
            </div>
          </Link>

          {/* Riders */}
          <Link href="/admin/riders" className="group bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-[#1A1816]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <span className="text-slate-400 font-black text-sm">{ridersCount || 0}</span>
            </div>
            <h2 className="font-black text-[#1A1816] text-lg uppercase tracking-tight">Corredores</h2>
            <p className="text-slate-400 text-xs font-bold mt-1 leading-relaxed">Ver, editar y gestionar el historial completo de corredores.</p>
            <div className="mt-4 text-[#1A1816] font-black text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              Administrar →
            </div>
          </Link>

          {/* Resultados */}
          <Link href="/admin/results" className="group bg-white rounded-2xl p-6 shadow-md border border-slate-100 hover:shadow-xl hover:-translate-y-1 transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <h2 className="font-black text-[#1A1816] text-lg uppercase tracking-tight">Resultados</h2>
            <p className="text-slate-400 text-xs font-bold mt-1 leading-relaxed">Ingresar posiciones y tiempos. El ranking se actualiza al instante.</p>
            <div className="mt-4 text-teal-600 font-black text-xs uppercase tracking-wider group-hover:translate-x-1 transition-transform">
              Cargar →
            </div>
          </Link>
        </div>

        {/* CALENDARIO DE FECHAS */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-black text-[#1A1816] text-sm uppercase tracking-widest">Calendario 2026</h3>
            <Link href="/admin/events" className="text-[11px] font-black text-slate-400 hover:text-[#C64928] uppercase tracking-widest transition-colors">
              Gestionar →
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(events || []).map((event) => {
              const isPast = event.date < today;
              const isNext = nextEvent?.id === event.id;
              return (
                <div key={event.id} className={`flex items-center justify-between px-6 py-3 ${isNext ? 'bg-[#C64928]/5' : ''}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      event.status === 'completed' ? 'bg-slate-300' :
                      (event.status === 'active' || event.status === 'pending') ? 'bg-green-400 animate-pulse' :
                      isNext ? 'bg-[#C64928]' : 'bg-slate-200'
                    }`} />
                    <div>
                      <p className={`font-black text-sm ${isPast ? 'text-slate-400' : 'text-[#1A1816]'}`}>{event.name}</p>
                      <p className="text-slate-400 text-[10px] font-bold">{formatDate(event.date)}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    event.status === 'completed' ? 'bg-slate-100 text-slate-400' :
                    (event.status === 'active' || event.status === 'pending') ? 'bg-green-100 text-green-700' :
                    isNext ? 'bg-[#C64928]/10 text-[#C64928]' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {event.status === 'completed' ? 'Finalizada' : (event.status === 'active' || event.status === 'pending') ? 'Activa' : isNext ? 'Próxima' : 'Programada'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </main>
  );
}