import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";
import { Rider } from '@/lib/definitions';
import RiderForm from '@/components/admin/RiderForm';
import RiderDorsalCell from '@/components/admin/RiderDorsalCell';
import { Event } from '@/lib/definitions';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "800", "900"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const { data: rider } = await supabase
    .from('riders')
    .select('*')
    .eq('id', id)
    .single();

  // Fetch eventos para gestión de dorsales
  const { data: events } = await supabase
    .from('events')
    .select('id, name, date')
    .order('date', { ascending: false });

  // Fetch dorsales actuales del rider
  const { data: dorsals } = await supabase
    .from('event_riders')
    .select('event_id, dorsal')
    .eq('rider_id', id);

  if (!rider) return (
    <div className="min-h-screen flex items-center justify-center bg-[#EFE6D5]">
        <div className="bg-white p-12 rounded-[2rem] shadow-2xl text-center border-t-8 border-[#C64928]">
            <p className="font-heading text-4xl uppercase italic text-slate-800 tracking-tighter">Rider no encontrado</p>
            <Link href="/admin/riders" className="text-xs font-black text-[#C64928] uppercase mt-6 block hover:underline tracking-widest">
                ← Volver al listado
            </Link>
        </div>
    </div>
  );

  return (
    <main className={`min-h-screen bg-[#EFE6D5] pb-32 ${montserrat.variable} ${teko.variable} font-sans`}>
      
      {/* HEADER NEGRO CURVO */}
      <header className="bg-[#1A1816] pt-10 pb-32 px-6 rounded-b-[50px] shadow-2xl relative border-b-[8px] border-[#C64928]">
        <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
                <Link href="/admin/riders" className="text-[#FFD700] text-[11px] font-black uppercase tracking-[0.3em] mb-3 block hover:text-white transition-colors">
                    ← VOLVER A LA LISTA
                </Link>
                <h1 className="font-heading text-7xl md:text-8xl text-white uppercase italic leading-[0.8] tracking-tighter">
                    EDITAR <span className="text-[#C64928]">RIDER</span>
                </h1>
                <p className="text-slate-400 font-black uppercase text-xs mt-4 tracking-[0.2em]">
                    GESTIÓN DE FICHA MAESTRA • ID: {id.slice(0,8).toUpperCase()}
                </p>
            </div>
        </div>
      </header>

      {/* CONTENEDOR DEL FORMULARIO */}
      <div className="max-w-5xl mx-auto px-4 -mt-20 relative z-20 space-y-8">
          <RiderForm 
            initialData={rider as Rider} 
            inscribedEvents={events?.filter(e => dorsals?.some(d => d.event_id === e.id)) || []} 
          />

          {/* GESTIÓN DE DORSALES POR EVENTO */}
          <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-2xl border-2 border-slate-200">
              <h2 className="font-heading text-4xl uppercase italic text-slate-800 tracking-tighter mb-8 flex items-center gap-3">
                  <span className="w-10 h-10 bg-[#C64928] text-white rounded-xl flex items-center justify-center font-bold text-2xl not-italic">#</span>
                  Gestión de Dorsales
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {events?.map((event) => {
                      const dorsal = dorsals?.find(d => d.event_id === event.id);
                      return (
                          <div key={event.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-[#C64928]/30 transition-all">
                              <div>
                                  <p className="font-black text-slate-900 uppercase text-xs truncate max-w-[200px]">{event.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">{new Date(event.date).toLocaleDateString('es-CL')}</p>
                              </div>
                              <RiderDorsalCell 
                                  riderId={id} 
                                  eventId={event.id} 
                                  initialDorsal={dorsal ? dorsal.dorsal : null} 
                              />
                          </div>
                      );
                  })}
              </div>
          </div>
      </div>

    </main>
  );
}