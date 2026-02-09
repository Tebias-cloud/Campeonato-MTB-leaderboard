import RiderForm from '@/components/admin/RiderForm';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], variable: '--font-montserrat' });

export default function NewRiderPage() {
  return (
    <main className={`min-h-screen bg-[#1A1816] text-[#EFE6D5] ${montserrat.variable} ${teko.variable} font-sans p-6 md:p-12`}>
      
      <div className="max-w-3xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-6">
            <div>
                <h1 className="font-heading text-4xl text-white uppercase tracking-wider">Nuevo Rider</h1>
                <p className="text-gray-400 text-xs mt-1">Ingresa los datos para inscribir a un competidor</p>
            </div>
            <Link 
                href="/admin" 
                className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors border border-white/10"
            >
                Cancelar
            </Link>
        </div>

        {/* FORMULARIO */}
        <div className="bg-[#252220] p-8 rounded-3xl shadow-2xl border border-white/5">
             {/* Renderizamos el formulario. Al no pasarle 'initialData', asume modo CREAR */}
             <RiderForm />
        </div>
      </div>
    </main>
  );
}