'use client';

import { Teko, Montserrat } from "next/font/google";
import { OFFICIAL_CATEGORIES } from '@/lib/categories';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-montserrat' });

interface Props {
  name: string;
  subtitle: string;
  description: string;
  price: string;
  date: string;
  terms: string;
  bankInfo: {
    owner: string;
    rut: string;
    bank: string;
    account: string;
    contact: string;
  };
}

export default function EventPreview({ name, subtitle, description, price, date, terms, bankInfo }: Props) {
  const labelClass = "block text-[11px] font-bold uppercase text-slate-500 mb-2 tracking-widest";
  const inputPlaceholder = "w-full p-3.5 bg-slate-50 text-slate-400 rounded-xl border border-slate-200 italic text-sm";

  // Lógica de título igual a inscripcion/page.tsx
  const titleMain = (name || 'NOMBRE DE LA CARRERA').split(' ').slice(0,-1).join(' ');
  const titleLast = (name || 'CARRERA').split(' ').pop();

  return (
    <div className={`${montserrat.variable} ${teko.variable} font-sans bg-[#F8FAFC] p-4 md:p-8 rounded-[2rem] border border-slate-200 shadow-inner`}>
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* HEADER SIMULADO EXACTO */}
        <div className="bg-[#1A1816] text-white p-8 md:p-12 rounded-3xl shadow-xl text-center border-t-4 border-[#C64928] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#C64928] to-transparent opacity-50"></div>
            <h1 className="font-heading text-5xl md:text-7xl uppercase italic leading-none mb-3 text-white">
                {titleMain} <span className="text-[#C64928]">{titleLast}</span>
            </h1>
            <p className="text-base md:text-xl text-slate-400 uppercase tracking-[0.15em] mb-6 font-medium">{subtitle || 'Subtítulo del evento'}</p>
            <div className="bg-white/5 p-6 rounded-2xl text-sm text-slate-300 text-center leading-relaxed font-light">
                {description || 'Descripción del evento...'}
                <div className="mt-4 pt-4 border-t border-white/10 text-[#C64928] text-sm md:text-base font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                    <span>🗓️</span> {date ? new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no definida'}
                </div>
            </div>
        </div>

        {/* 1. INFORMACIÓN DE PAGO SIMULADA EXACTA */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-heading text-3xl uppercase mb-8 text-slate-800 border-b border-slate-100 pb-4">1. Datos de Transferencia</h3>
            
            <div className="flex flex-col md:flex-row gap-8">
                {/* COLUMNA IZQUIERDA: PRECIO Y CONTACTO */}
                <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Inscripción</span>
                    <span className="text-5xl md:text-6xl font-heading font-bold text-[#1A1816] mt-2 mb-6">${price || '0'}</span>
                    
                    <div className="w-full pt-6 border-t border-slate-200">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Enviar comprobante a</span>
                        <span className="text-sm font-bold text-[#C64928]">{bankInfo.contact || 'No especificado'}</span>
                    </div>
                </div>

                {/* COLUMNA DERECHA: DATOS DEL BANCO */}
                <div className="flex-[2] flex flex-col justify-between">
                    <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Titular</p>
                            <p className="text-lg font-bold text-slate-800">{bankInfo.owner || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Banco</p>
                            <p className="text-base font-medium text-slate-700">{bankInfo.bank || '-'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cuenta</p>
                            <p className="text-base font-medium text-slate-700">{bankInfo.account || '-'}</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RUT</p>
                            <p className="text-base font-medium text-slate-700">{bankInfo.rut || '-'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 2. FORMULARIO SIMULADO */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
            <h3 className="font-heading text-3xl uppercase mb-8 text-slate-800 border-b border-slate-100 pb-4">2. Datos del Corredor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div><label className={labelClass}>Email</label><div className={inputPlaceholder}>ejemplo@correo.com</div></div>
                    <div><label className={labelClass}>Nombre Completo</label><div className={inputPlaceholder}>Juan Pérez</div></div>
                </div>
                <div className="space-y-4">
                    <div><label className={labelClass}>RUT</label><div className={inputPlaceholder}>12.345.678-9</div></div>
                    <div><label className={labelClass}>Categoría</label>
                        <div className="w-full p-3.5 bg-white border border-slate-200 rounded-xl flex justify-between items-center text-sm font-bold">
                            <span>{OFFICIAL_CATEGORIES[0].label}</span>
                            <span className="text-slate-300">▼</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* 3. REGLAMENTO SIMULADO */}
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
          <h3 className="font-heading text-3xl uppercase mb-6 text-slate-800 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#C64928]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            Reglamento
          </h3>
          <div className="h-60 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-6 text-xs text-slate-500 leading-relaxed whitespace-pre-wrap font-mono shadow-inner">
            {terms || 'Aquí se mostrará el reglamento que escribas...'}
          </div>
        </div>

      </div>
    </div>
  );
}
