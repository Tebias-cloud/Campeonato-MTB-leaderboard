import RiderForm from '@/components/admin/RiderForm';
import Link from 'next/link';

export default function AddRiderPage() {
  return (
    <main className="min-h-screen bg-sand-100 font-sans pb-20">
      
      {/* --- HEADER DE ADMINISTRACIÓN --- */}
      <header className="bg-[#1A1816] pt-8 pb-16 px-6 rounded-b-[40px] shadow-2xl relative overflow-hidden">
        {/* Patrón de fondo sutil */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-terra-500 via-transparent to-transparent"></div>
        
        <div className="max-w-md mx-auto relative z-10">
          {/* Botón Volver */}
          <Link href="/ranking" className="inline-flex items-center gap-2 text-sand-500 hover:text-white transition-colors mb-4 group">
            <span className="bg-white/10 p-1.5 rounded-full group-hover:bg-terra-500 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            </span>
            <span className="text-xs font-bold uppercase tracking-widest">Volver al Ranking</span>
          </Link>

          <h1 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none">
            Nuevo <span className="text-terra-500">Rider</span>
          </h1>
          <p className="text-gray-400 text-sm mt-2 font-medium max-w-xs">
            Ingresa los datos del competidor para la temporada 2026.
          </p>
        </div>
      </header>

      {/* --- FORMULARIO EN TARJETA FLOTANTE --- */}
      <div className="px-4 -mt-10 relative z-20 max-w-md mx-auto">
        <div className="bg-white rounded-[30px] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] border-4 border-white overflow-hidden">
          
          {/* Barra decorativa superior */}
          <div className="h-2 w-full bg-gradient-to-r from-terra-500 via-yellow-500 to-terra-500"></div>
          
          <div className="p-1">
            {/* Aquí cargamos tu componente RiderForm */}
            <RiderForm />
          </div>

        </div>

        {/* --- PIE DE PÁGINA DE AYUDA --- */}
        <div className="mt-8 text-center opacity-60">
          <p className="text-[10px] uppercase font-bold text-terra-800 tracking-widest mb-2">Panel de Control Chaski</p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>
              Soporte
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
              Ayuda
            </span>
          </div>
        </div>
      </div>

    </main>
  );
}