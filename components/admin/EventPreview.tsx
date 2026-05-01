'use client';

import { Teko, Montserrat } from "next/font/google";
import { normalizeCategory } from '@/lib/utils';
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
  const labelClass = "block text-[10px] font-bold uppercase text-slate-400 mb-1.5 tracking-widest";
  const inputPlaceholder = "bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-400 italic";

  return (
    <div className={`${montserrat.variable} ${teko.variable} font-sans bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200`}>
      {/* HEADER SIMULADO */}
      <div className="bg-[#1A1816] p-8 text-center border-b-8 border-[#C64928]">
        <h4 className="text-[#C64928] font-heading text-xl uppercase tracking-widest mb-2 italic">Previsualización en vivo</h4>
        <h1 className="text-white font-heading text-5xl uppercase italic leading-none">{name || 'NOMBRE DE LA CARRERA'}</h1>
        <p className="text-slate-400 font-heading text-lg uppercase tracking-widest mt-2">{subtitle || 'Subtítulo del evento'}</p>
        <div className="mt-4 inline-block bg-white/10 px-4 py-2 rounded-full text-white font-black text-xs tracking-widest uppercase">
          {date ? new Date(date + 'T12:00:00').toLocaleDateString('es-CL', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Fecha no definida'}
        </div>
      </div>

      <div className="p-8 space-y-8">
        {/* DESCRIPCIÓN */}
        <div className="bg-slate-50 p-6 rounded-2xl border-l-4 border-[#C64928]">
          <p className="text-slate-600 text-sm leading-relaxed italic whitespace-pre-wrap">
            {description || 'Aquí aparecerá la descripción de tu evento...'}
          </p>
        </div>

        {/* FORMULARIO SIMULADO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div><label className={labelClass}>Nombre Completo</label><div className={inputPlaceholder}>Ej: Juan Pérez</div></div>
            <div><label className={labelClass}>RUT</label><div className={inputPlaceholder}>12.345.678-9</div></div>
          </div>
          <div className="space-y-4">
            <div><label className={labelClass}>Categoría</label>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-800 font-bold flex justify-between items-center">
                <span>{OFFICIAL_CATEGORIES[0].label}</span>
                <span className="text-[10px] text-slate-400">▼</span>
              </div>
            </div>
            <div><label className={labelClass}>Club / Team</label><div className={inputPlaceholder}>INDEPENDIENTE / LIBRE</div></div>
          </div>
        </div>

        {/* BANCO SIMULADO */}
        <div className="bg-[#EFE6D5] p-8 rounded-3xl border-2 border-[#1A1816]/10 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
           </div>
           <div className="flex items-center gap-3 mb-4 border-b border-[#1A1816]/10 pb-2">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#C64928]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
             <h5 className="font-heading text-3xl text-[#1A1816] uppercase italic">Información de Pago</h5>
           </div>
             <div><span className="block text-[10px] font-black text-[#1A1816]/40 uppercase">Valor Inscripción</span><span className="text-2xl font-black text-[#C64928]">${price || '0'}</span></div>
             <div><span className="block text-[10px] font-black text-[#1A1816]/40 uppercase">Titular</span><span className="font-bold">{bankInfo.owner || '-'}</span></div>
             <div><span className="block text-[10px] font-black text-[#1A1816]/40 uppercase">Banco / Cuenta</span><span className="font-bold">{bankInfo.bank} - {bankInfo.account}</span></div>
             <div><span className="block text-[10px] font-black text-[#1A1816]/40 uppercase">Enviar Comprobante a:</span><span className="font-black text-[#C64928]">{bankInfo.contact || '-'}</span></div>
           </div>
        </div>

        {/* REGLAMENTO SIMULADO */}
        <div className="space-y-3">
          <h5 className="font-heading text-2xl text-slate-800 uppercase italic flex items-center gap-2">
            <span className="w-6 h-6 bg-[#1A1816] text-white rounded-md flex items-center justify-center text-xs not-italic">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </span>
            Reglamento del Evento
          </h5>
          <div className="h-40 overflow-y-auto bg-slate-50 border border-slate-200 rounded-2xl p-5 text-[11px] text-slate-500 leading-relaxed whitespace-pre-wrap font-mono">
            {terms || 'Aquí se mostrará el reglamento que escribas...'}
          </div>
        </div>
      </div>
    </div>
  );
}
