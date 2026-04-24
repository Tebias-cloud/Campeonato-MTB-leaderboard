'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    if (confirm('¿Cerrar sesión administrativa?')) {
      await supabase.auth.signOut();
      router.push('/login');
    }
  };

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
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
      )
    },
    {
      name: 'Solicitudes',
      path: '/admin/solicitudes',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
      )
    },
    {
      name: 'Eventos',
      path: '/admin/events',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      )
    },
    {
      name: 'Riders',
      path: '/admin/riders',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
      )
    },
    {
      name: 'Juez',
      path: '/admin/results',
      icon: (active: boolean) => (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={active ? 2.5 : 1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
      )
    }
  ];

  return (
    <>
      {/* Reserva de espacio inferior dinámica */}
      <div className="h-28 md:h-0"></div>

      <div className="fixed bottom-0 left-0 w-full z-50 px-2 pb-4 pt-2 md:px-4 md:pb-8">
        <div className="max-w-2xl mx-auto bg-[#1A1816] rounded-full md:rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10 flex justify-between items-center py-3 px-2 md:py-5 md:px-3 backdrop-blur-2xl bg-opacity-95 overflow-x-auto overflow-y-hidden no-scrollbar">
            
            {navItems.map((item) => {
                const active = isActive(item.path);
                return (
                    <Link 
                        key={item.path} 
                        href={item.path}
                        className={`flex flex-col items-center justify-center transition-all duration-300 flex-1 px-1 ${
                            active 
                            ? 'text-[#FFD700]' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                    >
                        <div className={`p-2 md:p-2.5 rounded-2xl transition-all ${active ? 'bg-white/10 scale-110 md:scale-110' : 'active:scale-95'}`}>
                            {item.icon(active)}
                        </div>
                        
                        {/* ✅ TRUCO RESPONSIVE: En móvil el texto solo se ve si está activo. En PC siempre se ve. */}
                        <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-center mt-1 transition-all duration-300 ${
                          active 
                          ? 'opacity-100 max-h-4' 
                          : 'opacity-0 max-h-0 overflow-hidden md:max-h-4 md:opacity-30'
                        }`}>
                            {item.name}
                        </span>
                    </Link>
                );
            })}

            <div className="w-[1px] h-8 md:h-10 bg-white/10 mx-1 md:mx-2 flex-shrink-0"></div>
            
            <button 
                onClick={handleLogout}
                className="flex flex-col items-center justify-center text-[#C64928] hover:text-red-500 transition-all px-2 md:px-4 group flex-shrink-0"
            >
                <div className="p-2 md:p-2.5 group-active:scale-90 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                </div>
                <span className="text-[8px] md:text-[9px] font-black uppercase tracking-widest mt-1 opacity-0 max-h-0 md:max-h-4 md:opacity-30 md:group-hover:opacity-100 transition-all overflow-hidden">
                    Salir
                </span>
            </button>

        </div>
      </div>
      
      {/* Estilo para ocultar la barra de scroll en navegadores si los iconos se desbordan en pantallas minúsculas */}
      <style dangerouslySetInnerHTML={{__html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </>
  );
}