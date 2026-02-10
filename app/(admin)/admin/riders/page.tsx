import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";
import { Rider } from '@/lib/definitions';
import RiderFilters from '@/components/admin/RiderFilters';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function RidersListPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const params = await searchParams;
  const queryText = params.query || '';
  const categoryFilter = params.category || '';

  // 1. CONSTRUCCIÓN DE LA QUERY DINÁMICA
  let query = supabase
    .from('riders')
    .select('*')
    .order('created_at', { ascending: false });

  // --- ACTUALIZACIÓN 1: AHORA BUSCAMOS TAMBIÉN POR RUT ---
  if (queryText) {
    // Buscamos en Nombre, Club O RUT
    query = query.or(`full_name.ilike.%${queryText}%,club.ilike.%${queryText}%,rut.ilike.%${queryText}%`);
  }

  // Filtro de Categoría
  if (categoryFilter && categoryFilter !== 'Todas') {
    query = query.eq('category', categoryFilter);
  }

  const { data: riders } = await query.returns<Rider[]>();

  return (
    <main className={`min-h-screen bg-[#EFE6D5] text-[#2A221B] ${montserrat.variable} ${teko.variable} font-sans pb-20`}>
      
      {/* HEADER */}
      <header className="bg-[#1A1816] pt-8 pb-24 px-6 rounded-b-[40px] shadow-2xl relative border-b-[6px] border-[#C64928]">
        <div className="max-w-4xl mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
            <div>
              <Link href="/admin" className="text-[#FFD700] text-xs font-bold uppercase tracking-widest mb-2 block hover:underline">← Volver al Panel</Link>
              <h1 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none">
                Base de <span className="text-[#C64928]">Riders</span>
              </h1>
              <p className="text-gray-400 text-sm mt-1 font-bold uppercase tracking-wider">
                {riders?.length || 0} Corredores encontrados
              </p>
            </div>
            
            <Link href="/admin/riders/new" className="bg-[#C64928] text-white px-6 py-3 rounded-xl font-heading text-xl uppercase shadow-lg hover:bg-[#A03518] hover:scale-105 transition-all flex items-center gap-2">
                <span>+</span> Nuevo Rider
            </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 -mt-16 relative z-20">
        
        {/* COMPONENTE DE FILTROS */}
        <div className="bg-white p-2 rounded-2xl shadow-lg mb-4">
            <RiderFilters />
        </div>

        {/* LISTA DE RIDERS */}
        <div className="space-y-3">
            {riders?.map((rider) => (
                <Link 
                    key={rider.id} 
                    href={`/admin/riders/${rider.id}`} 
                    className="block bg-white p-4 rounded-2xl shadow-sm border-l-4 border-[#EFE6D5] hover:border-[#C64928] hover:shadow-md hover:translate-x-1 transition-all group"
                >
                    <div className="flex items-center gap-4">
                        {/* Avatar / Inicial */}
                        <div className="w-12 h-12 bg-[#EFE6D5] rounded-xl flex items-center justify-center font-heading text-2xl text-[#1A1816] font-bold group-hover:bg-[#1A1816] group-hover:text-[#FFD700] transition-colors border border-gray-100">
                            {rider.full_name[0]}
                        </div>
                        
                        {/* Info Principal */}
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-[#1A1816] text-lg uppercase leading-none truncate group-hover:text-[#C64928] transition-colors">
                                {rider.full_name}
                            </h3>
                            
                            {/* --- ACTUALIZACIÓN 2: MOSTRAR CIUDAD Y RUT --- */}
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-gray-500 font-medium">
                                {rider.rut && (
                                    <span className="font-mono bg-gray-100 px-1 rounded text-gray-600">
                                        {rider.rut}
                                    </span>
                                )}
                                {rider.ciudad && (
                                    <span className="flex items-center gap-1 uppercase">
                                        📍 {rider.ciudad}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span className="bg-[#1A1816] text-white text-[9px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                                    {rider.category}
                                </span>
                                {rider.club && (
                                    <span className="text-[10px] text-gray-500 font-bold uppercase truncate">
                                        • {rider.club}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Icono Editar */}
                        <div className="bg-gray-50 p-2 rounded-lg text-gray-300 group-hover:text-[#C64928] transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                        </div>
                    </div>
                </Link>
            ))}

            {riders?.length === 0 && (
                <div className="bg-white rounded-2xl p-10 text-center shadow-sm opacity-70">
                    <p className="font-heading text-2xl text-gray-400 uppercase">No se encontraron riders</p>
                    <p className="text-xs text-gray-500 font-bold mt-1">Intenta con otro nombre, RUT o categoría</p>
                </div>
            )}
        </div>
      </div>
    </main>
  );
}