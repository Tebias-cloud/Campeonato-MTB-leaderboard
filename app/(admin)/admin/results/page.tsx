import { supabase } from '@/lib/supabase';
import ResultManager from '@/components/admin/ResultManager';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";
import { Event, Rider, RawResult } from '@/lib/definitions';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const params = await searchParams;

  const { data: events } = await supabase.from('events').select('*').order('date', { ascending: true }).returns<Event[]>();
  const { data: riders } = await supabase.from('riders').select('*').order('full_name', { ascending: true }).returns<Rider[]>();
  const { data: results, error } = await supabase.from('results').select('*').order('created_at', { ascending: false }).returns<RawResult[]>();

  if (error) console.error("Error fetching results:", error);

  return (
    <main className={`min-h-screen bg-[#1A1816] text-[#EFE6D5] ${montserrat.variable} ${teko.variable} font-sans selection:bg-[#C64928] selection:text-white pb-20`}>
      <header className="relative h-[300px] md:h-[350px] bg-[#1A1816] pt-8 px-6 rounded-b-[40px] shadow-2xl overflow-hidden border-b-[8px] border-[#C64928]">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1547234935-80c7142ee969?q=80&w=2574&auto=format&fit=crop')] bg-cover bg-bottom opacity-60 mix-blend-luminosity"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1816] via-[#1A1816]/70 to-transparent"></div>

        <div className="relative z-10 max-w-6xl mx-auto flex flex-col justify-center h-full pb-10">
            <Link href="/admin" className="inline-flex items-center gap-2 text-white/70 hover:text-[#C64928] text-xs font-bold uppercase tracking-widest mb-4 transition-colors w-fit">
              <span className="bg-white/10 p-1.5 rounded-full">←</span> Volver al Panel
            </Link>
            <div>
              <h1 className="font-heading text-6xl md:text-8xl text-white uppercase italic leading-none drop-shadow-xl">
                Juez <span className="text-[#C64928]">Virtual</span>
              </h1>
              <p className="text-gray-400 text-sm font-bold uppercase tracking-widest mt-2 ml-1">
                  Gestión de Resultados • Temporada 2026
              </p>
            </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto px-4 -mt-16 relative z-20">
         <div className="bg-[#EFE6D5] rounded-3xl p-4 md:p-8 shadow-2xl border border-white/10 text-[#1A1816]">
             <ResultManager events={events || []} riders={riders || []} existingResults={results || []} />
         </div>
      </div>
    </main>
  );
}