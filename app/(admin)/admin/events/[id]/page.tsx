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
    <div className={`min-h-screen bg-[#F8FAFC] py-6 px-3 md:py-12 ${montserrat.variable} ${teko.variable} ${robotoMono.variable} font-sans text-slate-800`}>
      <div className="max-w-5xl mx-auto">
        
        {/* TOP BAR */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
           <Link href="/admin/events" className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-2 border border-slate-200">
             ← Volver a Eventos
           </Link>
           
           <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
              <button 
                onClick={() => setActiveTab('edit')}
                className={`flex-1 md:w-32 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'edit' ? 'bg-[#1A1816] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Configuración
              </button>
              <button 
                onClick={() => setActiveTab('preview')}
                className={`flex-1 md:w-32 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'preview' ? 'bg-[#1A1816] text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Vista Previa
              </button>
           </div>

           <div className="hidden md:block">
             <span className="bg-[#C64928] text-white px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] shadow-md italic">
               {isNew ? 'Nueva Carrera' : 'Editando Fecha'}
             </span>
           </div>
        </div>

        {activeTab === 'edit' ? (
          <form action={formAction} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <input type="hidden" name="id" value={id} />
              <input type="hidden" name="form_config" value={updatedFormConfig} />
              <input type="hidden" name="bank_account" value={`${formData.bank_account_type} - ${formData.bank_account_number}`} />

              {/* HEADER SECTION */}
              <div className="bg-[#1A1816] p-8 md:p-14 rounded-[3rem] shadow-2xl border-b-[10px] border-[#C64928] relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#C64928]/10 to-transparent pointer-events-none"></div>
                  <div className="max-w-3xl mx-auto space-y-6 relative z-10 text-center">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-[#C64928] uppercase tracking-[0.4em] block">Título del Evento</label>
                        <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-transparent border-b-2 border-white/10 focus:border-[#C64928] text-center font-heading text-5xl md:text-8xl uppercase italic outline-none text-white py-2 transition-all" placeholder="NOMBRE DE LA CARRERA" />
                      </div>
                      
                      <input type="text" name="subtitle" value={formData.subtitle} onChange={handleChange} className="w-full bg-transparent border-b-2 border-white/5 focus:border-[#C64928] text-center font-heading text-xl md:text-3xl text-slate-400 uppercase tracking-[0.3em] outline-none py-2" placeholder="Slogan o subtítulo..." />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
                          <label className={labelClass.replace('text-slate-500', 'text-slate-400')}>Fecha Oficial</label>
                          <input type="date" name="date" value={formData.date} onChange={handleChange} required className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#C64928] font-bold text-lg" />
                        </div>
                        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 text-left">
                          <label className={labelClass.replace('text-slate-500', 'text-slate-400')}>Estado de Inscripción</label>
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
                                className={`flex flex-col items-center justify-center p-2 rounded-xl border-2 transition-all ${formData.status === st.id ? 'border-white bg-white/10' : 'border-transparent bg-white/5 grayscale opacity-40 hover:opacity-70'}`}
                              >
                                <span className={`w-2 h-2 rounded-full ${st.color} mb-1.5 shadow-[0_0_8px_currentColor]`}></span>
                                <span className="text-[8px] font-black uppercase text-white tracking-tighter">{st.label}</span>
                              </button>
                            ))}
                            <input type="hidden" name="status" value={formData.status} />
                          </div>
                        </div>
                      </div>

                      <div className="mt-8 text-left">
                        <label className={labelClass.replace('text-slate-500', 'text-slate-400')}>Descripción Breve</label>
                        <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm text-slate-300 outline-none focus:border-[#C64928] transition-all" placeholder="Detalles rápidos del evento..."></textarea>
                      </div>
                  </div>
              </div>

              {/* PAYMENT SECTION */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border-b-4 border-slate-200">
                      <div className="flex items-center gap-4 mb-8">
                         <div className="w-12 h-12 bg-[#EFE6D5] rounded-2xl flex items-center justify-center text-2xl">💰</div>
                         <h3 className="font-heading text-4xl uppercase text-slate-800 italic">Datos Bancarios</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                           <label className={labelClass}>Titular de la Cuenta</label>
                           <input type="text" name="bank_owner" value={formData.bank_owner} onChange={handleChange} className={editableInputClass} placeholder="Ej: Club Deportivo MTB" />
                        </div>
                        <div>
                           <label className={labelClass}>RUT del Titular</label>
                           <input type="text" name="bank_rut" value={formData.bank_rut} onChange={handleChange} className={editableInputClass} placeholder="12.345.678-9" />
                        </div>
                        <div>
                           <label className={labelClass}>Banco</label>
                           <input type="text" name="bank_name" value={formData.bank_name} onChange={handleChange} className={editableInputClass} placeholder="Banco Estado, Santander, etc" />
                        </div>
                        <div>
                           <label className={labelClass}>Tipo de Cuenta</label>
                           <input type="text" name="bank_account_type" value={formData.bank_account_type} onChange={handleChange} className={editableInputClass} placeholder="Cuenta Rut, Vista, Corriente..." />
                        </div>
                        <div>
                           <label className={labelClass}>N° de Cuenta</label>
                           <input type="text" name="bank_account_number" value={formData.bank_account_number} onChange={handleChange} className={editableInputClass} placeholder="0000000000" />
                        </div>
                        <div className="md:col-span-2 mt-4 pt-6 border-t-2 border-dashed border-slate-100">
                            <label className={labelClass}>Contacto para Comprobantes (WhatsApp o Email)</label>
                            <input 
                              type="text" 
                              name="payment_contact"
                              value={formData.payment_contact} 
                              onChange={handleChange} 
                              className={`${editableInputClass} border-[#C64928]/30 bg-orange-50/20 text-[#C64928]`} 
                              placeholder="Ej: +56912345678 o tesoreria@club.cl" 
                              required 
                            />
                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-2 ml-1 tracking-widest">Este dato aparecerá destacado en el formulario público.</p>
                        </div>
                      </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="bg-white p-8 rounded-[3rem] shadow-xl border-b-4 border-slate-200 flex flex-col items-center justify-center text-center py-14">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">Precio Inscripción</label>
                      <div className="flex items-center gap-1">
                        <span className="font-heading text-4xl text-[#C64928] italic mt-2">$</span>
                        <input type="text" name="price" value={formData.price} onChange={handleChange} required className="bg-transparent border-b-4 border-slate-200 focus:border-[#C64928] text-center w-40 outline-none font-heading text-7xl text-slate-900 transition-all" />
                      </div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 tracking-widest">Valor único por participante</p>
                  </div>

                  <div className="bg-orange-600 p-8 rounded-[3rem] shadow-2xl text-white relative overflow-hidden group">
                      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-all"></div>
                      <h4 className="font-heading text-2xl uppercase italic mb-2">Categorías</h4>
                      <p className="text-xs text-orange-100 leading-relaxed font-medium">Se utilizará la lista oficial de categorías del campeonato para este evento.</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Elite', 'Master A', 'Novicios'].map(c => (
                          <span key={c} className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">{c}</span>
                        ))}
                        <span className="bg-white/20 px-3 py-1 rounded-full text-[9px] font-black uppercase">+ {OFFICIAL_CATEGORIES.length - 3} más</span>
                      </div>
                  </div>
                </div>
              </div>

              {/* TERMS SECTION */}
              <div className="bg-white p-8 md:p-14 rounded-[3.5rem] shadow-2xl border-b-[10px] border-slate-200">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-black">!</div>
                    <h3 className="font-heading text-4xl uppercase text-slate-800 italic">Reglamento y Términos</h3>
                  </div>
                  <textarea 
                    name="terms_conditions" 
                    value={formData.terms_conditions} 
                    onChange={handleChange} 
                    rows={15} 
                    className="w-full p-8 bg-slate-50 border-2 border-slate-200 rounded-[2rem] text-slate-600 text-sm outline-none focus:border-[#C64928] focus:bg-white font-mono transition-all leading-relaxed shadow-inner"
                    placeholder="Escribe aquí las reglas, condiciones y deslindes de responsabilidad..."
                  ></textarea>
                  <div className="mt-4 flex items-center gap-2 text-slate-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Puedes usar saltos de línea para separar párrafos.</span>
                  </div>
              </div>

              {/* SAVE BUTTON */}
              <div className="sticky bottom-6 z-40">
                <button type="submit" disabled={isPending} className="w-full bg-[#1A1816] hover:bg-[#C64928] text-white font-heading text-4xl py-6 rounded-3xl shadow-2xl transition-all italic border-b-[8px] border-black hover:border-orange-950 active:translate-y-1 active:border-b-0">
                    {isPending ? 'GUARDANDO CAMBIOS...' : '💾 PUBLICAR CAMBIOS'}
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