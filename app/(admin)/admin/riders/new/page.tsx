import RiderForm from '@/components/admin/RiderForm';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export default function NewRiderPage() {
  return (
    // CAMBIO 1: Usamos el fondo beige (#EFE6D5) para coincidir con Edit y List
    <main className={`min-h-screen bg-[#EFE6D5] text-[#2A221B] ${montserrat.variable} ${teko.variable} font-sans p-4 md:p-8`}>
      
      <div className="max-w-md mx-auto">
        
        {/* Botón Volver (Consistente con EditPage) */}
        {/* CAMBIO 2: Apunta a /admin/riders en lugar de /admin */}
        <Link href="/admin/riders" className="inline-flex items-center gap-2 text-gray-500 font-bold uppercase text-xs mb-6 hover:text-[#C64928] transition-colors">
            <span>←</span> Cancelar y Volver
        </Link>

        {/* Tarjeta Principal */}
        <div className="bg-white p-6 md:p-8 rounded-[30px] shadow-xl border-t-[12px] border-[#C64928] relative overflow-hidden">
            
            {/* Decoración de fondo */}
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
            </div>

            <div className="relative z-10">
                <h1 className="font-heading text-4xl text-[#1A1816] uppercase leading-none mb-1">
                    Nuevo Rider
                </h1>
                <p className="text-sm text-gray-400 font-bold mb-6 uppercase tracking-wider">
                    Inscripción Temporada 2026
                </p>

                {/* FORMULARIO (Sin props = Modo Crear) */}
                <RiderForm />
            </div>
        </div>

      </div>
    </main>
  );
}