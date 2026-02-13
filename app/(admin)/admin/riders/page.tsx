import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import { Rider } from '@/lib/definitions';
import RiderFilters from '@/components/admin/RiderFilters';

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: '--font-montserrat' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-mono' });

export const dynamic = 'force-dynamic';

export default async function RidersListPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; category?: string }>;
}) {
  const params = await searchParams;
  const queryText = params.query || '';
  const categoryFilter = params.category || '';

  let query = supabase
    .from('riders')
    .select('*')
    .order('full_name', { ascending: true });

  if (queryText) {
    query = query.or(`full_name.ilike.%${queryText}%,club.ilike.%${queryText}%,rut.ilike.%${queryText}%`);
  }

  if (categoryFilter && categoryFilter !== 'Todas') {
    query = query.eq('category', categoryFilter);
  }

  const { data: riders } = await query.returns<Rider[]>();

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  return (
    <main className={`min-h-screen bg-[#EFE6D5] text-[#1A1816] ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans pb-32`}>
      
      {/* HEADER ESTILO PANEL ADMIN */}
      <header className="bg-[#1A1816] pt-12 pb-24 px-6 rounded-b-[50px] shadow-2xl relative border-b-[8px] border-[#C64928]">
        <div className="max-w-[95rem] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <Link href="/admin" className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block hover:underline">
              ← VOLVER AL PANEL
            </Link>
            <h1 className="font-heading text-6xl md:text-7xl text-white uppercase italic leading-none tracking-tighter">
              BASE DE <span className="text-[#C64928]">RIDERS</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Base de Datos Completa Temporada 2026</p>
          </div>
          
          <Link href="/admin/riders/new" className="bg-[#C64928] text-white px-8 py-3 rounded-2xl font-heading text-2xl uppercase italic shadow-lg hover:bg-[#A03518] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border-b-4 border-black/20">
            + NUEVO RIDER
          </Link>
        </div>
      </header>

      {/* CONTENIDO EXPANDIDO (Ancho mayor para mostrar todos los datos) */}
      <div className="max-w-[95rem] mx-auto px-4 -mt-12 relative z-20 space-y-6">
        
        {/* FILTROS */}
        <div className="bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100">
          <RiderFilters />
        </div>

        {/* TABLA MAESTRA TIPO EXCEL */}
        <div className="bg-white border border-slate-100 shadow-2xl overflow-hidden rounded-[2.5rem]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 border-b-2 border-slate-100 text-[9px] uppercase font-black tracking-widest text-slate-400">
                  <th className="px-6 py-5">RUT / ID</th>
                  <th className="px-6 py-5">CORREDOR & CONTACTO</th>
                  <th className="px-6 py-5">CATEGORÍA</th>
                  <th className="px-6 py-5">CLUB / TEAM</th>
                  <th className="px-6 py-5">UBICACIÓN</th>
                  <th className="px-6 py-5">NACIMIENTO</th>
                  <th className="px-6 py-5 text-center">ACCIÓN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {riders?.map((rider) => (
                  <tr key={rider.id} className="hover:bg-orange-50/40 transition-all group">
                    
                    {/* RUT */}
                    <td className="px-6 py-4 border-r border-slate-50">
                      <div className="bg-[#1A1816] text-[#C64928] font-mono font-bold text-xs px-2 py-1 rounded shadow-inner inline-block">
                        {rider.rut}
                      </div>
                    </td>

                    {/* NOMBRE, EMAIL, TEL, IG */}
                    <td className="px-6 py-4">
                      <div className="font-black text-[#1A1816] text-sm uppercase leading-tight tracking-tighter">
                        {rider.full_name}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1">
                        <span className="text-[9px] text-slate-400 font-bold lowercase">{rider.email || 'sin@correo.cl'}</span>
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] text-slate-500 font-black">📞 {rider.phone || '-'}</span>
                           {rider.instagram && (
                             <span className="text-[9px] text-pink-600 font-black italic">@{(rider.instagram).replace('@','')}</span>
                           )}
                        </div>
                      </div>
                    </td>

                    {/* CATEGORÍA */}
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black uppercase text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                        {rider.category}
                      </span>
                    </td>

                    {/* CLUB */}
                    <td className="px-6 py-4">
                      <div className="text-[#1A1816] font-black italic uppercase text-[11px] truncate max-w-[150px]">
                        {rider.club || <span className="text-slate-300 font-normal">Independiente</span>}
                      </div>
                    </td>

                    {/* CIUDAD */}
                    <td className="px-6 py-4">
                       <div className="text-[11px] font-black uppercase text-slate-600">
                          {rider.ciudad || 'No especificada'}
                       </div>
                    </td>

                    {/* FECHA NACIMIENTO */}
                    <td className="px-6 py-4 font-mono text-[11px] font-bold text-slate-500">
                       {formatDate(rider.birth_date)}
                    </td>

                    {/* ACCION */}
                    <td className="px-6 py-4 text-center">
                      <Link 
                        href={`/admin/riders/${rider.id}`}
                        className="inline-flex items-center justify-center bg-white text-[#1A1816] h-9 px-4 rounded-xl border-2 border-slate-200 font-black uppercase text-[9px] tracking-widest hover:bg-[#1A1816] hover:text-white hover:border-[#1A1816] transition-all"
                      >
                        EDITAR
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {(!riders || riders.length === 0) && (
              <div className="py-24 text-center bg-white">
                <h3 className="font-heading text-4xl text-slate-300 uppercase italic">Sin resultados</h3>
              </div>
            )}
          </div>
        </div>

        {/* FOOTER INFO */}
        <div className="text-center opacity-30">
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">{riders?.length || 0} REGISTROS EN TOTAL</p>
        </div>
      </div>
    </main>
  );
}