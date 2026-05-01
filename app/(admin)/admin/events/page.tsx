import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import { Event } from '@/lib/definitions';
import CopyLinkButton from '@/components/admin/CopyLinkButton';
import DeleteEventButton from '@/components/admin/DeleteEventButton';

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: '--font-montserrat' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-mono' });

export const dynamic = 'force-dynamic';

export default async function EventsAdminPage() {
  const { data } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });

  const events = (data || []) as Event[];

  // Lógica inteligente de fechas
  const todayStr = new Date().toISOString().split('T')[0]; 
  
  const activeEvents = events.filter(e => e.status === 'pending');
  const scheduledEvents = events.filter(e => e.status === 'scheduled');
  const pastEvents = events.filter(e => e.status === 'completed' || (!['pending', 'scheduled'].includes(e.status)));

  const formatDateShort = (dateStr: string) => {
    const date = new Date(`${dateStr}T12:00:00`);
    const day = date.toLocaleDateString('es-CL', { day: '2-digit' });
    const month = date.toLocaleDateString('es-CL', { month: 'short' }).substring(0, 3);
    return { day, month };
  };

  return (
    <main className={`min-h-screen bg-[#F8FAFC] text-slate-800 ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans pb-60`}>
      
      {/* HEADER AJUSTADO (Menos padding abajo para que no quede vacío) */}
      <header className="bg-[#1A1816] pt-10 pb-12 md:pb-16 px-4 md:px-6 rounded-b-[2.5rem] shadow-xl relative border-b-[6px] border-[#C64928]">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <Link href="/admin" className="text-[#C64928] text-[10px] font-black uppercase tracking-[0.3em] mb-2 inline-flex items-center gap-1 hover:text-white transition-colors bg-white/5 px-3 py-1.5 rounded-lg">
              <span className="text-lg leading-none mb-0.5">←</span> Volver al Panel
            </Link>
            <h1 className="font-heading text-5xl md:text-7xl text-white uppercase italic leading-none tracking-tighter mt-2">
              MIS <span className="text-[#C64928]">EVENTOS</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[9px] md:text-[10px] tracking-[0.2em] mt-2">Gestor Central de Temporada</p>
          </div>
          
          <Link href="/admin/events/new" className="w-full md:w-auto bg-gradient-to-b from-[#C64928] to-[#A03518] text-white px-6 py-3 md:py-4 rounded-xl font-heading text-2xl uppercase italic shadow-lg hover:from-white hover:to-slate-200 hover:text-[#1A1816] transition-all transform active:scale-95 flex items-center justify-center gap-2 border-b-[4px] border-orange-950 hover:border-slate-400">
            + NUEVA CARRERA
          </Link>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL (Se quitó el margen negativo para que baje al fondo claro) */}
      <div className="max-w-5xl mx-auto px-3 md:px-4 pt-8 md:pt-10 relative z-20 space-y-12">
        
        {/* SECCIÓN 1: ACTIVAS (INSCRIPCIONES ABIERTAS) */}
        <div>
          <div className="mb-6">
            <h2 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] ml-2 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
               En Curso (Inscripciones Abiertas)
            </h2>
            <p className="text-[10px] text-slate-400 ml-6 mt-1.5 font-bold uppercase tracking-wider leading-relaxed">
              Estas carreras están habilitadas para recibir inscripciones. El evento más próximo aparecerá automáticamente en la página principal.
            </p>
          </div>
          
          <div className="space-y-4">
            {activeEvents.length === 0 ? (
               <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center shadow-sm">
                 <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">No hay eventos activos</p>
                 <p className="text-slate-600 text-sm mt-1">Cambia el estado de una carrera a "Activa" para abrir inscripciones.</p>
               </div>
            ) : (
              activeEvents.map((ev: Event) => {
                const dateObj = formatDateShort(ev.date);
                return (
                  <div key={ev.id} className="bg-white rounded-3xl p-4 md:p-5 shadow-lg border-2 border-green-500/20 hover:border-[#C64928]/50 transition-colors flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 group">
                    
                    {/* CALENDARIO VISUAL */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl w-full md:w-20 flex flex-row md:flex-col items-center justify-center py-2 md:py-3 shrink-0 overflow-hidden">
                      <div className="bg-[#C64928] text-white text-[8px] font-black uppercase tracking-widest w-full text-center py-1 hidden md:block">FECHA</div>
                      <span className="font-heading text-4xl md:text-4xl text-slate-800 leading-none">{dateObj.day}</span>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-2 md:ml-0 md:mt-1">{dateObj.month}</span>
                    </div>

                    {/* INFO DEL EVENTO */}
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-black text-slate-900 text-xl md:text-2xl uppercase leading-tight tracking-tight">{ev.name}</h3>
                          {ev.subtitle && (
                            <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase mt-1">{ev.subtitle}</p>
                          )}
                        </div>
                        <span className="font-heading text-3xl md:text-4xl text-[#C64928] italic leading-none shrink-0">${ev.price || '0'}</span>
                      </div>
                      
                      {/* BOTONES Y LINK */}
                      <div className="mt-4 flex flex-col md:flex-row items-stretch md:items-center gap-3">
                         <div className="w-full md:w-48">
                           <CopyLinkButton path={`/inscripcion/${ev.id}`} />
                         </div>
                         <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0 ml-auto">
                            <Link href={`/inscripcion/${ev.id}`} target="_blank" className="flex-1 md:flex-none p-3 md:px-4 md:py-2 bg-slate-100 text-slate-600 hover:text-[#C64928] hover:bg-red-50 rounded-xl transition-colors flex justify-center items-center font-bold text-[10px] uppercase tracking-wider gap-2 shadow-sm">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                               Ver Form
                            </Link>
                            <Link href={`/admin/events/${ev.id}`} className="flex-1 md:flex-none p-3 md:px-4 md:py-2 bg-[#1A1816] text-white hover:bg-[#C64928] rounded-xl transition-colors flex justify-center items-center shadow-md font-bold text-[10px] uppercase tracking-wider gap-2">
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                               Ajustes
                            </Link>
                            <DeleteEventButton id={ev.id} />
                         </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* SECCIÓN 1.5: PROGRAMADAS (CERRADAS POR AHORA) */}
        {scheduledEvents.length > 0 && (
          <div>
            <div className="mb-6">
              <h2 className="text-xs font-black uppercase text-slate-500 tracking-[0.2em] ml-2 flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.8)]"></span>
                 Próximas Fechas (Cerradas)
              </h2>
              <p className="text-[10px] text-slate-400 ml-6 mt-1.5 font-bold uppercase tracking-wider leading-relaxed">
                Eventos creados pero inactivos. El formulario público no está disponible. Entra a Ajustes y pásalas a "Activa" cuando quieras abrir inscripciones.
              </p>
            </div>
            
            <div className="space-y-4">
              {scheduledEvents.map((ev: Event) => {
                const dateObj = formatDateShort(ev.date);
                return (
                  <div key={ev.id} className="bg-white rounded-3xl p-4 shadow-md border border-slate-200 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 opacity-90">
                    <div className="bg-slate-100 border border-slate-200 rounded-2xl w-full md:w-20 flex flex-row md:flex-col items-center justify-center py-2 shrink-0">
                      <span className="font-heading text-3xl text-slate-600 leading-none">{dateObj.day}</span>
                      <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest ml-2 md:ml-0 md:mt-1">{dateObj.month}</span>
                    </div>
                    <div className="flex-1 w-full flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-black text-slate-700 text-lg uppercase leading-tight">{ev.name}</h3>
                        <span className="text-[9px] font-black uppercase tracking-widest text-yellow-600 bg-yellow-50 px-2 py-0.5 rounded mt-1 inline-block border border-yellow-200">Programada</span>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Link href={`/admin/events/${ev.id}`} className="flex-1 md:flex-none p-3 px-6 bg-slate-800 text-white hover:bg-slate-700 rounded-xl transition-colors flex justify-center items-center shadow-md font-bold text-[10px] uppercase tracking-wider">
                           Ajustes / Abrir
                        </Link>
                        <DeleteEventButton id={ev.id} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN 2: HISTORIAL / CERRADAS */}
        {pastEvents.length > 0 && (
          <div className="opacity-80 pt-4 border-t-2 border-dashed border-slate-200">
            <div className="mb-5">
              <h2 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] ml-2 flex items-center gap-2">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Historial / Cerradas
              </h2>
              <p className="text-[10px] text-slate-400/80 ml-8 mt-1.5 font-bold uppercase tracking-wider leading-relaxed">
                Carreras que ya pasaron de fecha o que pausaste manualmente. El formulario público está bloqueado para nuevos competidores.
              </p>
            </div>
            
            <div className="space-y-3">
              {pastEvents.map((ev: Event) => (
                <div key={ev.id} className="bg-white rounded-2xl p-3 md:p-4 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 grayscale-[0.4] hover:grayscale-0 transition-all">
                  
                  <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="bg-slate-100 px-3 py-1.5 rounded-lg text-center shrink-0">
                      <span className="block font-mono text-xs font-bold text-slate-500">{ev.date.split('-').reverse().join('/')}</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-700 text-sm md:text-base uppercase leading-tight">{ev.name}</h3>
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block border border-slate-200">Inactiva</span>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full md:w-auto">
                      <Link href={`/admin/events/${ev.id}`} className="flex-1 md:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors flex justify-center items-center font-bold text-[10px] uppercase tracking-wider shadow-sm">
                         Editar / Reabrir
                      </Link>
                      <DeleteEventButton id={ev.id} />
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}