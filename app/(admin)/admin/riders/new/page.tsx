import RiderForm from '@/components/admin/RiderForm';
import Link from 'next/link';
import { Teko, Montserrat } from "next/font/google";

const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "800", "900"], variable: '--font-montserrat' });

export default function NewRiderPage() {
  return (
    <main className={`min-h-screen bg-[#EFE6D5] pb-24 ${montserrat.variable} ${teko.variable} font-sans`}>
      
      {/* HEADER NEGRO CURVO */}
      <header className="bg-[#1A1816] pt-8 pb-28 px-6 rounded-b-[40px] shadow-2xl relative border-b-[6px] border-[#C64928]">
        <div className="max-w-5xl mx-auto relative z-10">
            <Link href="/admin/riders" className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block hover:text-white transition-colors">
                ← VOLVER A LA LISTA
            </Link>
            <h1 className="font-heading text-6xl md:text-7xl text-white uppercase italic leading-none tracking-tighter">
                GESTIÓN <span className="text-[#C64928]">RIDER</span>
            </h1>
            <p className="text-slate-400 font-black uppercase text-[10px] mt-2 tracking-[0.2em]">
                TEMPORADA 2026 • BASE DE DATOS OFICIAL
            </p>
        </div>
      </header>

      {/* FORMULARIO FLOTANTE COMPACTO */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-20">
          <RiderForm />
      </div>

    </main>
  );
}