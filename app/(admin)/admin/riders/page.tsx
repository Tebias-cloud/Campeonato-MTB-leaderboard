import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import { Rider } from '@/lib/definitions';
import RiderFilters from '@/components/admin/RiderFilters';
import ExportExcelButton from '@/components/admin/ExportExcelButton';

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

  // ✅ 1. Generamos la fecha
  const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
  
  // ✅ 2. Detectamos si hay una categoría filtrada y armamos el nombre
  // Si está en "Todas" (o vacío), se llama "Todas_Las_Categorias". 
  // Si filtraste "Elite Open", se llamará "Elite_Open".
  const categoriaArchivo = (!categoryFilter || categoryFilter === 'Todas') 
    ? 'Todas_Las_Categorias' 
    : categoryFilter.replace(/ /g, '_'); // Cambia los espacios por guiones bajos
    
  const nombreArchivo = `Riders_${categoriaArchivo}_${fechaHoy}`;

  const datosParaExcel = riders?.map(rider => ({
    'RUT': rider.rut,
    'Corredor': rider.full_name,
    'Categoría': rider.category,
    'Club / Team': rider.club || 'INDEPENDIENTE',
    'Ciudad': rider.ciudad || 'No especificada',
    'Teléfono': rider.phone || '-',
    'Email': rider.email || '-',
    'F. Nacimiento': formatDate(rider.birth_date),
    'Instagram': rider.instagram ? `@${rider.instagram.replace('@', '')}` : '-'
  })) || [];

  return (
    <main className={`min-h-screen bg-[#EFE6D5] text-[#1A1816] ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans pb-32`}>
      
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
          
          <div className="flex flex-col sm:flex-row items-center gap-3">
            {riders && riders.length > 0 && (
              <ExportExcelButton data={datosParaExcel} fileName={nombreArchivo} />
            )}
            
            <Link href="/admin/riders/new" className="bg-[#C64928] text-white px-8 py-3 rounded-2xl font-heading text-2xl uppercase italic shadow-lg hover:bg-[#A03518] transition-all transform hover:scale-105 active:scale-95 flex items-center gap-2 border-b-4 border-black/20">
              + NUEVO RIDER
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-[95rem] mx-auto px-4 -mt-12 relative z-20 space-y-6">
        
        <div className="bg-white p-4 rounded-[2rem] shadow-2xl border border-slate-100">
          <RiderFilters />
        </div>

        <div className="bg-white border-2 border-slate-200 shadow-2xl overflow-hidden rounded-[2.5rem]">
          <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#C64928] scrollbar-track-slate-100">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              
              {/* ✅ CABECERA DE ALTO CONTRASTE TIPO RACING */}
              <thead className="bg-[#1A1816] border-b-4 border-[#C64928] text-[10px] uppercase font-black tracking-widest text-[#EFE6D5]">
                <tr>
                  <th className="px-6 py-5 w-36">RUT / ID</th>
                  <th className="px-6 py-5 min-w-[250px]">CORREDOR & CONTACTO</th>
                  <th className="px-6 py-5 min-w-[180px]">CATEGORÍA</th>
                  <th className="px-6 py-5 min-w-[250px]">CLUB / TEAM</th>
                  <th className="px-6 py-5 min-w-[150px]">UBICACIÓN</th>
                  <th className="px-6 py-5 w-32">NACIMIENTO</th>
                  <th className="px-6 py-5 text-center w-32">ACCIÓN</th>
                </tr>
              </thead>
              
              <tbody className="divide-y-2 divide-slate-100">
                {riders?.map((rider) => (
                  <tr key={rider.id} className="bg-white hover:bg-[#EFE6D5]/40 transition-colors group">
                    
                    <td className="px-6 py-4 align-top">
                      <div className="bg-slate-100 text-[#C64928] border border-slate-200 font-mono font-bold text-xs px-2 py-1 rounded shadow-sm inline-block">
                        {rider.rut}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      {/* ✅ BREAK-WORDS PERMITE QUE EL TEXTO BAJE DE LÍNEA */}
                      <div className="font-black text-[#1A1816] text-sm uppercase leading-tight tracking-tighter whitespace-normal break-words">
                        {rider.full_name}
                      </div>
                      <div className="flex flex-col gap-0.5 mt-1.5">
                        <span className="text-[10px] text-slate-500 font-bold lowercase truncate">{rider.email || 'sin@correo.cl'}</span>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                           <span className="text-[10px] text-slate-600 font-black">📞 {rider.phone || '-'}</span>
                           {rider.instagram && (
                             <span className="text-[10px] text-pink-600 font-black italic">@{(rider.instagram).replace('@','')}</span>
                           )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                      <span className="text-[10px] font-black uppercase text-[#1A1816] bg-[#FFD700]/30 px-3 py-1.5 rounded-lg border border-[#FFD700]/50 shadow-sm inline-block">
                        {rider.category}
                      </span>
                    </td>

                    <td className="px-6 py-4 align-top">
                      {/* ✅ TEXTOS LARGOS AHORA SE VEN COMPLETOS */}
                      <div className="text-[#C64928] font-black italic uppercase text-xs leading-snug whitespace-normal break-words">
                        {rider.club || <span className="text-slate-400 font-bold normal-case">Independiente</span>}
                      </div>
                    </td>

                    <td className="px-6 py-4 align-top">
                       <div className="text-xs font-bold uppercase text-slate-700 whitespace-normal break-words">
                          {rider.ciudad || 'No especificada'}
                       </div>
                    </td>

                    <td className="px-6 py-4 align-top font-mono text-xs font-bold text-slate-500">
                       {formatDate(rider.birth_date)}
                    </td>

                    <td className="px-6 py-4 text-center align-middle">
                      <Link 
                        href={`/admin/riders/${rider.id}`}
                        className="inline-flex items-center justify-center bg-white text-[#1A1816] h-10 px-5 rounded-xl border-2 border-[#1A1816] font-black uppercase text-[10px] tracking-widest hover:bg-[#1A1816] hover:text-[#EFE6D5] transition-all shadow-md hover:shadow-lg"
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

        <div className="text-center opacity-40">
          <p className="text-[10px] font-black uppercase tracking-[0.4em]">{riders?.length || 0} REGISTROS EN TOTAL</p>
        </div>
      </div>
    </main>
  );
}