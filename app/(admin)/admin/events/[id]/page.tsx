'use client';

import { use, useEffect, useState, useActionState } from 'react';
import { supabase } from '@/lib/supabase';
import { saveEvent, type EventSaveState } from '@/actions/events';
import Link from 'next/link';
import { Teko, Montserrat, Roboto_Mono } from "next/font/google";
import { Event, OFFICIAL_CATEGORIES } from '@/lib/definitions';
import EventPreview from '@/components/admin/EventPreview';

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
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Estado local para live preview
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    description: '',
    date: '',
    status: 'pending',
    price: '20.000',
    bank_owner: '',
    bank_rut: '',
    bank_name: '',
    bank_account_type: '',
    bank_account_number: '',
    terms_conditions: '',
    payment_contact: ''
  });

  const [loading, setLoading] = useState(!isNew);

  useEffect(() => {
    if (!isNew) {
      const fetchEvent = async () => {
        const { data, error } = await supabase.from('events').select('*').eq('id', id).single();
        if (data && !error) {
          const bankParts = (data.bank_account || '').split(' - ');
          
          let paymentContact = '';
          if (data.form_config && typeof data.form_config === 'object') {
            const config = data.form_config as EventFormConfig;
            paymentContact = config.payment_contact || '';
          }

          setFormData({
            name: data.name || '',
            subtitle: data.subtitle || '',
            description: data.description || '',
            date: data.date || '',
            status: data.status || 'pending',
            price: data.price || '20.000',
            bank_owner: data.bank_owner || '',
            bank_rut: data.bank_rut || '',
            bank_name: data.bank_name || '',
            bank_account_type: bankParts[0] || '',
            bank_account_number: bankParts[1] || '',
            terms_conditions: data.terms_conditions || '',
            payment_contact: paymentContact
          });
        }
        setLoading(false);
      };
      fetchEvent();
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const editableInputClass = "w-full p-4 bg-white border-2 border-slate-200 rounded-2xl focus:border-[#C64928] focus:ring-4 focus:ring-orange-50 outline-none font-bold text-slate-800 transition-all placeholder:text-slate-300 shadow-sm";
  const labelClass = "block text-[11px] font-black uppercase text-slate-500 mb-2 tracking-widest ml-1";

  const updatedFormConfig = JSON.stringify({
    categories: OFFICIAL_CATEGORIES,
    payment_contact: formData.payment_contact
  });

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-4 border-[#C64928] border-t-transparent rounded-full animate-spin"></div>
      <p className="font-heading text-2xl text-slate-400 uppercase tracking-widest">Preparando Editor...</p>
    </div>
  );

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-6 px-3 md:py-8 ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans text-slate-800 pb-40`}>
      <div className="max-w-5xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-6">
           <Link href="/admin/events" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 border border-slate-200">
             ← Volver a Eventos
           </Link>
           
           <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`flex-1 md:w-32 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-[#1A1816] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Configuración
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`flex-1 md:w-32 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-[#1A1816] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Vista Previa
              </button>
           </div>

           <div className="w-full md:w-48">
              {!isNew && (
                <button 
                  onClick={handleCopy}
                  className={`inline-block text-[10px] font-black uppercase px-4 py-2.5 rounded-xl border transition-all w-full text-center shadow-sm active:scale-95 flex items-center justify-center gap-2 ${
                    copied 
                      ? 'bg-green-100 text-green-800 border-green-300' 
                      : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
                  {copied ? 'LINK COPIADO' : 'COPIAR LINK'}
                </button>
              )}
           </div>
        </div>

        {activeTab === 'edit' ? (
          <form action={formAction} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="form_config" value={updatedFormConfig} />
              <input type="hidden" name="bank_account" value={`${formData.bank_account_type} - ${formData.bank_account_number}`} />

              <div className="bg-[#1A1816] p-6 md:p-8 rounded-[2rem] shadow-2xl border-b-[6px] border-[#C64928] relative overflow-hidden">
                  <div className="max-w-3xl mx-auto space-y-4 relative z-10 text-center">
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-transparent border-b-2 border-white/10 focus:border-[#C64928] text-center font-heading text-4xl md:text-5xl uppercase italic outline-none text-white py-1 transition-all" placeholder="NOMBRE DE LA CARRERA" />
                      <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="w-full bg-transparent border-b-2 border-white/5 focus:border-[#C64928] text-center font-heading text-lg md:text-xl text-slate-400 uppercase tracking-[0.2em] outline-none py-1" placeholder="Slogan o subtítulo..." />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                          <label className={labelClass.replace('text-slate-500', 'text-slate-400')}>Fecha Oficial</label>
                          <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-lg p-2.5 text-white outline-none focus:border-[#C64928] font-bold text-sm" />
                        </div>
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-left">
                          <label className={labelClass.replace('text-slate-500', 'text-slate-400')}>Estado</label>
                          <div className="grid grid-cols-3 gap-2 mt-1">
                            {[
                              { id: 'pending', label: 'Abierta', color: 'bg-green-500' },
                              { id: 'scheduled', label: 'Programada', color: 'bg-yellow-500' },
                              { id: 'completed', label: 'Finalizada', color: 'bg-slate-500' }
                            ].map(st => (
                              <button 
                                key={st.id} 
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, status: st.id }))}
                                className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all ${formData.status === st.id ? 'border-white bg-white/10' : 'border-transparent bg-white/5 opacity-50'}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${st.color} mb-1`}></span>
                                <span className="text-[8px] font-black uppercase text-white tracking-tighter">{st.label}</span>
                              </button>
                            ))}
                            <input type="hidden" name="status" value={formData.status} />
                          </div>
                        </div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200">
                      <h3 className="font-heading text-2xl uppercase text-slate-800 mb-4 italic">Datos Bancarios</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                           <label className={labelClass}>Titular</label>
                           <input type="text" name="bank_owner" value={formData.bank_owner} onChange={handleChange} className={editableInputClass} />
                        </div>
                        <div>
                           <label className={labelClass}>RUT</label>
                           <input type="text" name="bank_rut" value={formData.bank_rut} onChange={handleChange} className={editableInputClass} />
                        </div>
                        <div>
                           <label className={labelClass}>Banco</label>
                           <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className={editableInputClass} />
                        </div>
                        <div>
                           <label className={labelClass}>Tipo de Cuenta</label>
                           <input type="text" name="bank_account_type" value={formData.bank_account_type} onChange={handleChange} className={editableInputClass} />
                        </div>
                        <div>
                           <label className={labelClass}>Número</label>
                           <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className={editableInputClass} />
                        </div>
                        <div className="md:col-span-2">
                            <label className={labelClass}>Contacto de Pago</label>
                            <input type="text" name="payment_contact" value={formData.payment_contact} onChange={handleChange} className={editableInputClass} required />
                        </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col items-center justify-center text-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Precio</label>
                      <div className="flex items-center gap-1">
                        <span className="text-2xl font-black text-[#C64928]">$</span>
                        <input type="text" name="price" value={formData.price} onChange={handleChange} required className="bg-transparent border-b-2 border-slate-200 text-center w-32 outline-none font-heading text-5xl text-slate-900" />
                      </div>
                  </div>

                  <div className="bg-orange-600 p-6 rounded-[2rem] shadow-lg text-white">
                      <h4 className="font-heading text-xl uppercase italic mb-2">Categorías</h4>
                      <p className="text-[10px] text-orange-100 leading-relaxed font-bold uppercase">Se utiliza la lista oficial de categorías.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Elite', 'Master A', 'Novicios'].map(c => (
                          <span key={c} className="bg-white/20 px-2 py-1 rounded-lg text-[8px] font-black uppercase">{c}</span>
                        ))}
                  </div>
                </div>
              </div>
            </div>

              {/* TERMS SECTION */}
              <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl border-b-[10px] border-slate-200">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <h3 className="font-heading text-3xl uppercase text-slate-800 italic">Reglamento y Términos</h3>
                  </div>
                  <textarea 
                    name="terms_conditions" 
                    value={formData.terms_conditions} 
                    onChange={handleChange} 
                    rows={12} 
                    className="w-full p-6 bg-slate-50 border-2 border-slate-200 rounded-[1.5rem] text-slate-600 text-sm outline-none focus:border-[#C64928] focus:bg-white font-mono transition-all leading-relaxed shadow-inner"
                    placeholder="Escribe aquí las reglas, condiciones y deslindes de responsabilidad..."
                  ></textarea>
                  <div className="mt-3 flex items-center gap-2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Puedes usar saltos de línea para separar párrafos.</span>
                  </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="sticky bottom-6 z-40">
                <button type="submit" disabled={isPending} className="w-full bg-[#1A1816] hover:bg-[#C64928] text-white font-heading text-4xl py-6 rounded-3xl shadow-2xl transition-all italic border-b-[8px] border-black hover:border-orange-950 active:translate-y-1 active:border-b-0">
                    {isPending ? 'GUARDANDO CAMBIOS...' : 'PUBLICAR CAMBIOS'}
                </button>
              </div>
          </form>
        ) : (
          <div className="animate-in fade-in zoom-in-95 duration-500">
            <EventPreview 
              name={formData.name}
              subtitle={formData.subtitle}
              description={formData.description}
              price={formData.price}
              date={formData.date}
              terms={formData.terms_conditions}
              bankInfo={{
                owner: formData.bank_owner,
                rut: formData.bank_rut,
                bank: formData.bank_name,
                account: `${formData.bank_account_type} - ${formData.bank_account_number}`,
                contact: formData.payment_contact
              }}
            />
            <div className="mt-8 text-center bg-blue-50 border border-blue-200 p-6 rounded-3xl">
              <p className="text-blue-700 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Esto es una simulación
              </p>
              <p className="text-blue-600 text-xs mt-1">Así es como verán los corredores el formulario de inscripción en sus celulares y computadoras.</p>
              <button 
                onClick={() => setActiveTab('edit')}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md"
              >
                Volver a Editar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}