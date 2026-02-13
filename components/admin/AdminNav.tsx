'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminNav() {
  const pathname = usePathname();

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'Solicitudes',
      path: '/admin/solicitudes',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      )
    },
    {
      name: 'Riders',
      path: '/admin/riders',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    },
    {
      name: 'Juez',
      path: '/admin/results',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    }
  ];

  return (
    <>
      {/* Aumento del espacio de reserva al final de la página */}
      <div className="h-32 md:h-0"></div>

      <div className="fixed bottom-0 left-0 w-full z-50 px-4 pb-8 pt-2">
        <div className="max-w-xl mx-auto bg-[#1A1816] rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex justify-around items-center py-5 px-3 backdrop-blur-2xl bg-opacity-95">
            
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link 
                        key={item.path} 
                        href={item.path}
                        className={`flex flex-col items-center gap-1.5 transition-all duration-300 flex-1 ${
                            active 
                            ? 'text-chaski-gold' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <div className={`p-2.5 rounded-2xl transition-all ${active ? 'bg-white/10 scale-110' : 'active:scale-95'}`}>
                            {item.icon(active)}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest text-center transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}

            <div className="w-[1px] h-10 bg-white/10 mx-2"></div>
            
            <Link href="/ranking" className="flex flex-col items-center gap-1.5 text-chaski-terra hover:text-red-500 transition-all px-4 group">
                <div className="p-2.5 group-active:scale-90 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest opacity-30 group-hover:opacity-100">Salir</span>
            </Link>

        </div>
      </div>
    </>
  );
}