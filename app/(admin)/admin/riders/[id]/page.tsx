import { supabase } from '@/lib/supabase';
import RiderForm from '@/components/admin/RiderForm';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export const dynamic = 'force-dynamic';

export default async function EditRiderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // 1. Buscamos al rider por su ID
  const { data: rider } = await supabase
    .from('riders')
    .select('*')
    .eq('id', id)
    .single();

  if (!rider) return <div className="p-10 text-center">Rider no encontrado</div>;

  return (
     <div className={`min-h-screen bg-[#EFE6D5] p-4 md:p-8 ${montserrat.variable} ${teko.variable} font-sans`}>
         
         <div className="max-w-md mx-auto">
             {/* Botón Volver */}
             <Link href="/admin/riders" className="inline-flex items-center gap-2 text-gray-500 font-bold uppercase text-xs mb-6 hover:text-[#C64928] transition-colors">
                <span>←</span> Volver a la lista
             </Link>

             <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-xl border-t-[12px] border-[#FFD700] relative overflow-hidden">
                 
                 {/* Decoración de fondo */}
                 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                 </div>

                 <div className="relative z-10">
                    <h1 className="font-heading text-4xl text-[#1A1816] uppercase leading-none mb-1">
                        Editar Perfil
                    </h1>
                    <p className="text-sm text-gray-400 font-bold mb-6 uppercase tracking-wider">
                        {rider.full_name}
                    </p>
                    
                    {/* SOLUCIÓN DEFINITIVA: Desactivamos la alerta de 'any' solo para esta línea */}
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    <RiderForm initialData={rider as any} /> 
                 </div>
             </div>

             <div className="mt-8 text-center">
                <p className="text-[10px] text-gray-400 uppercase">ID del sistema: {rider.id}</p>
             </div>
         </div>
     </div>
  );
}