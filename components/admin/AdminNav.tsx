'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

  // Función simple para saber si el link está activo
  const isActive = (path: string) => {
    if (path === '/admin' && pathname === '/admin') return true;
    if (path !== '/admin' && pathname.startsWith(path)) return true;
    return false;
  };

  const navItems = [
    {
      name: 'Panel',
      path: '/admin',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'Riders',
      path: '/admin/riders',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    },
    {
      name: 'Juez',
      path: '/admin/results',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2 : 1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    }
  ];

  return (
    <>
      {/* ESPACIO VACÍO AL FINAL PARA QUE EL CONTENIDO NO QUEDE TAPADO POR LA BARRA */}
      <div className="h-24"></div>

      {/* BARRA FLOTANTE FIJA */}
      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-4 pt-2">
        <div className="max-w-md mx-auto bg-[#1A1816] rounded-2xl shadow-2xl border border-white/10 flex justify-around items-center py-3 backdrop-blur-md">
            
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link 
                        key={item.path} 
                        href={item.path}
                        className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                            active 
                            ? 'text-chaski-gold scale-110' 
                            : 'text-gray-500 hover:text-white'
                        }`}
                    >
                        <div className={`p-1 rounded-full ${active ? 'bg-white/10' : ''}`}>
                            {item.icon(active)}
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${active ? 'opacity-100' : 'opacity-60'}`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}

            {/* BOTÓN SALIR (Lleva a la Home Pública) */}
            <div className="w-[1px] h-8 bg-white/10 mx-1"></div>
            
            <Link href="/ranking" className="flex flex-col items-center gap-1 text-chaski-terra hover:text-red-500 transition-colors opacity-80">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                <span className="text-[10px] font-bold uppercase tracking-widest">Salir</span>
            </Link>

        </div>
      </div>
    </>
  );
}