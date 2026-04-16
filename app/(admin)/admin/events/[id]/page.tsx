'use client';

import { use, useEffect, useState, useActionState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEvent, type EventSaveState } from '@/actions/events';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import { Event, OFFICIAL_CATEGORIES } from '@/lib/definitions';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: '--font-montserrat' });
const robotoMono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-mono' });

interface EventFormConfig {
  categories?: string[];
  payment_contact?: string;
  fields?: unknown[];
}

export default function EventEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const isNew = id === 'new';

  const [state, formAction, isPending] = useActionState<EventSaveState, FormData>(saveEvent, null);
  const [eventData, setEventData] = useState<Partial<Event>>({ status: 'pending', price: '20.000' });
  const [loading, setLoading] = useState(!isNew);

  const [accountType, setAccountType] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  // Inicia vacío para obligar al Admin a escribirlo
  const [paymentContact, setPaymentContact] = useState('');

  useEffect(() => {
    if (!isNew) {
      const fetchEvent = async () => {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (data && !error) {
          setEventData(data);
          
          const savedAccount = data.bank_account || '';
          if (savedAccount.includes(' - ')) {
            const [type, num] = savedAccount.split(' - ');
            setAccountType(type || '');
            setAccountNumber(num || '');
          } else {
            setAccountNumber(savedAccount);
          }

          if (data.form_config && typeof data.form_config === 'object') {
            const config = data.form_config as EventFormConfig;
            if (config.payment_contact) setPaymentContact(config.payment_contact);
          }
        }
        setLoading(false);
      };
      fetchEvent();
    }
  }, [id, isNew]);

  const editableInputClass = "w-full p-3.5 bg-white/80 border-2 border-dashed border-slate-300 rounded-xl focus:border-[#C64928] focus:bg-white focus:border-solid outline-none font-bold text-slate-800 transition-all";
  const labelClass = "block text-[10px] font-black uppercase text-[#C64928] mb-1 tracking-widest";

  const currentConfig = (eventData.form_config as EventFormConfig) || {};
  const updatedFormConfig = JSON.stringify({
    ...currentConfig,
    categories: OFFICIAL_CATEGORIES,
    payment_contact: paymentContact
  });

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-heading text-4xl animate-pulse text-slate-400 uppercase">Cargando...</div>;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-6 px-3 md:py-24 ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans text-slate-800`}>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        <div className="flex justify-between items-center mb-4 relative z-10">
           <Link href="/admin/events" className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-colors flex items-center gap-2">
             ← Volver
           </Link>
           <span className="bg-[#C64928] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-md italic">Editor</span>
        </div>

        <form action={formAction} className="space-y-6 relative z-0">
            <input type="hidden" name="id" value={id} />
            <input type="hidden" name="form_config" value={updatedFormConfig} />
            <input type="hidden" name="status" value="pending" />
            <input type="hidden" name="bank_account" value={`${accountType} - ${accountNumber}`} />

            <div className="bg-[#1A1816] text-white p-6 md:p-12 rounded-t-[2.5rem] rounded-b-3xl shadow-2xl text-center border-b-[8px] border-[#C64928]">
                <div className="max-w-2xl mx-auto space-y-4">
                    <input type="text" name="name" defaultValue={eventData.name} required className="w-full bg-transparent border-b-2 border-slate-700 focus:border-[#C64928] text-center font-heading text-5xl md:text-7xl uppercase italic outline-none text-white py-2" placeholder="NOMBRE CARRERA" />
                    <input type="text" name="subtitle" defaultValue={eventData.subtitle} className="w-full bg-transparent border-b-2 border-slate-700 focus:border-[#C64928] text-center font-heading text-xl md:text-3xl text-slate-300 uppercase tracking-[0.2em] outline-none" placeholder="SUBTÍTULO" />
                    
                    <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
                        <textarea name="description" defaultValue={eventData.description} rows={4} className="w-full bg-black/20 border border-slate-700 rounded-xl p-4 text-sm text-slate-200 outline-none focus:border-[#C64928] mt-4" placeholder="Descripción..."></textarea>
                        <input type="date" name="date" defaultValue={eventData.date} required className="w-full bg-black/20 border border-slate-700 rounded-lg p-2 text-center text-white outline-none focus:border-[#C64928] font-bold mt-4" />
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-lg border-b-4 border-slate-200">
                <h3 className="font-heading text-3xl uppercase mb-6 text-slate-800 italic text-center">Banco</h3>
                <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] border-2 border-dashed border-slate-300 max-w-xl mx-auto">
                    <div className="mb-8 text-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Precio ($)</label>
                        <input type="text" name="price" defaultValue={eventData.price} required className="bg-transparent border-b-4 border-slate-300 focus:border-[#C64928] text-center w-48 outline-none font-heading text-6xl text-slate-900" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                        <div className="md:col-span-2"><label className={labelClass}>Titular</label><input type="text" name="bank_owner" defaultValue={eventData.bank_owner} className={editableInputClass} /></div>
                        <div><label className={labelClass}>RUT</label><input type="text" name="bank_rut" defaultValue={eventData.bank_rut} className={editableInputClass} /></div>
                        <div><label className={labelClass}>Banco</label><input type="text" name="bank_name" defaultValue={eventData.bank_name} className={editableInputClass} /></div>
                        <div><label className={labelClass}>Tipo de Cuenta</label><input type="text" value={accountType} onChange={(e) => setAccountType(e.target.value)} className={editableInputClass} /></div>
                        <div><label className={labelClass}>N° de Cuenta</label><input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} className={editableInputClass} /></div>
                        <div className="md:col-span-2 mt-2 pt-4 border-t border-slate-200">
                            <label className={labelClass}>Correo/WhatsApp para Comprobantes *</label>
                            {/* ✅ REQUIRED añadido aquí para forzar su llenado */}
                            <input 
                              type="text" 
                              value={paymentContact} 
                              onChange={(e) => setPaymentContact(e.target.value)} 
                              className={`${editableInputClass} text-[#C64928]`} 
                              placeholder="Ej: correo@ejemplo.com o +569..." 
                              required 
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1A1816] text-slate-300 p-6 md:p-12 rounded-[2.5rem] shadow-2xl border-b-8 border-[#C64928]">
                <h3 className="font-heading text-2xl uppercase text-white italic border-b border-white/10 pb-4">Reglamento</h3>
                <textarea name="terms_conditions" defaultValue={eventData.terms_conditions} rows={12} className="w-full p-5 bg-white/5 border-2 border-white/20 rounded-2xl text-white text-xs outline-none focus:border-[#C64928] font-mono mt-4"></textarea>
            </div>

            <div className="sticky bottom-6 z-40 pt-4">
              <button type="submit" disabled={isPending} className="w-full bg-[#C64928] hover:bg-[#1A1816] text-white font-heading text-4xl py-6 rounded-3xl shadow-2xl transition-all italic border-b-[6px] border-orange-950">
                  {isPending ? 'GUARDANDO...' : '💾 GUARDAR CAMBIOS'}
              </button>
            </div>
        </form>
      </div>
    </div>
  );
}