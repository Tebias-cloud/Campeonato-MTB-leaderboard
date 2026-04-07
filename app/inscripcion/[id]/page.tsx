'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { submitRegistration, type RegisterState } from '@/actions/register';
import { Teko, Montserrat } from "next/font/google";
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/definitions';
import Link from 'next/link';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: '--font-montserrat' });

const initialState: RegisterState = { message: null, success: false, fields: {} };

const BACKUP_CATEGORIES = [
  "Elite Open", "Pre Master (16 a 29 Años)", "Master A (30 a 39 Años)", "Master B (40 a 49 Años)", 
  "Master C (50 a 59 Años)", "Master D (60 Años y Más)", "Novicios Open (55k - Recién empezando)", 
  "Damas Pre Master (15 a 29 Años)", "Damas Master A (30 a 39 Años)", "Damas Master B (40 a 49 Años)", 
  "Damas Master C (50 Años y más)", "Novicias Open (55k - Recién empezando)", 
  "E-Bike Open Mixto (Sin restricciones)", "Enduro Open Mixto (Horquilla 140mm+)"
];

interface EventFormConfig {
  categories?: string[];
  payment_contact?: string;
  poster_url?: string;
}

interface CustomEvent extends Omit<Event, 'form_config'> {
  form_config: EventFormConfig | null;
}

export default function InscripcionPage() {
  const [state, formAction, isPending] = useActionState(submitRegistration, initialState);
  
  const [formValues, setFormValues] = useState({
    email: '', full_name: '', rut: '', club: 'INDEPENDIENTE / LIBRE',
    ciudad: '', phone: '', birth_date: '', category_selected: '', instagram: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [clubsList, setClubsList] = useState<string[]>([]);
  const [isManualClub, setIsManualClub] = useState(false);
  const [event, setEvent] = useState<CustomEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  // CLASES OPTIMIZADAS PARA LEGIBILIDAD
  const labelClass = "block text-[11px] font-bold uppercase text-slate-500 mb-2 tracking-widest";
  const inputClass = (name: string) => `w-full p-3.5 bg-slate-50 text-slate-900 rounded-xl border transition-all font-medium placeholder:text-slate-400 ${
    errors[name] ? 'border-red-500 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-100 outline-none' : 'border-slate-200 focus:border-[#C64928] focus:bg-white focus:ring-4 focus:ring-orange-50/50 outline-none'
  }`;

  useEffect(() => {
    const fetchData = async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const { data: eventData } = await supabase
        .from('events').select('*').eq('status', 'pending').gte('date', hoy).order('date', { ascending: true }).limit(1).single();

      if (eventData) setEvent(eventData as CustomEvent);
      
      const { data: clubsData } = await supabase.from('clubs').select('name').order('name');
      if (clubsData) setClubsList(clubsData.map(c => c.name));
      setLoading(false);
    };
    fetchData();
  }, []);

  const formatRut = (value: string) => {
    const clean = value.replace(/[^0-9kK]/g, '').slice(0, 9);
    if (clean.length <= 1) return clean;
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();
    let formattedBody = "";
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) formattedBody = "." + formattedBody;
        formattedBody = body[i] + formattedBody;
    }
    return `${formattedBody}-${dv}`;
  };

  const formatPhone = (value: string) => {
    const clean = value.replace(/\D/g, ''); 
    return clean.slice(0, 9); 
  };

  const checkRut = (rut: string) => {
    const cleanRut = rut.replace(/\./g, '').replace(/\s/g, '');
    if (!/^[0-9]+-[0-9kK]{1}$/.test(cleanRut)) return false;
    const [body, dv] = cleanRut.split('-');
    let sum = 0; let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i)) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDv = 11 - (sum % 11);
    const calcDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
    return calcDv === dv.toUpperCase();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const finalValue = name === 'rut' ? formatRut(value) : name === 'phone' ? formatPhone(value) : value;
    
    setFormValues(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
  };

  const handleSubmitWrapper = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    const required = ['email', 'full_name', 'rut', 'club', 'ciudad', 'phone', 'birth_date', 'category_selected'];
    
    required.forEach(field => { if (!formData.get(field)) newErrors[field] = "Este campo es requerido"; });
    
    const rut = formData.get('rut') as string;
    if (rut && !checkRut(rut)) newErrors['rut'] = "RUT inválido";

    const phone = formData.get('phone') as string;
    if (phone && (phone.length !== 9 || !phone.startsWith('9'))) {
      newErrors['phone'] = "Debe tener 9 dígitos y empezar con 9";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      document.getElementById('ficha-corredor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (event?.id) formData.append('event_id', event.id);
    formAction(formData);
  };

  if (loading) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-400 font-heading text-3xl animate-pulse tracking-widest">Cargando...</div>;
  if (!event) return <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center text-slate-500 font-heading text-4xl text-center px-4">NO HAY EVENTOS ABIERTOS</div>;

  if (state.success) {
    return (
      <div className={`min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4 ${montserrat.variable} ${teko.variable} font-sans`}>
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] max-w-lg w-full text-center border border-slate-100">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h2 className="text-4xl md:text-5xl font-heading font-bold uppercase mb-4 text-slate-900">¡Inscripción Exitosa!</h2>
          <p className="text-slate-500 font-medium mb-10 text-base leading-relaxed">
            Hemos recibido tus datos y te enviamos un correo de confirmación.<br/><br/>
            No olvides enviar tu comprobante de pago para validar tu cupo en el ranking oficial.
          </p>
          <Link href="/" className="inline-block w-full bg-[#C64928] hover:bg-[#a63b1f] text-white font-bold text-lg uppercase tracking-widest py-4 rounded-xl transition-colors">
            Ver Ranking Oficial
          </Link>
        </div>
      </div>
    );
  }

  const categories = event.form_config?.categories ?? BACKUP_CATEGORIES;
  const contactInfo = event.form_config?.payment_contact ?? 'No especificado (Consulta a la organización)';
  const posterUrl = event.form_config?.poster_url;

  const accountInfo = event.bank_account || '';
  const hasSeparator = accountInfo.includes(' - ');
  const displayType = hasSeparator ? accountInfo.split(' - ')[0] : 'Tipo de Cuenta';
  const displayNumber = hasSeparator ? accountInfo.split(' - ')[1] : accountInfo;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-8 px-4 md:py-16 ${montserrat.variable} ${teko.variable} font-sans text-slate-800 flex flex-col`}>
      <div className="max-w-3xl mx-auto w-full space-y-8 flex-grow"> {/* Reducido de 4xl a 3xl para que el form no sea tan ancho y los campos se vean mejor proporcionados */}
        
        <div className="flex justify-start">
           <Link href="/" className="text-slate-400 hover:text-slate-800 text-[10px] font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
             ← Volver al Ranking
           </Link>
        </div>

        {/* HEADER LIMPIO */}
        <div className="bg-[#1A1816] text-white p-8 md:p-12 rounded-3xl shadow-xl text-center border-t-4 border-[#C64928]">
            {posterUrl && (
                <div className="mb-8 w-full max-w-xl mx-auto rounded-2xl overflow-hidden shadow-2xl">
                    <img src={posterUrl} alt="Afiche del evento" className="w-full h-auto object-cover" loading="eager" />
                </div>
            )}
            <h1 className="font-heading text-5xl md:text-7xl uppercase italic leading-none mb-3 text-white">
                {event.name.split(' ').slice(0,-1).join(' ')} <span className="text-[#C64928]">{event.name.split(' ').pop()}</span>
            </h1>
            <p className="text-base md:text-xl text-slate-400 uppercase tracking-[0.15em] mb-6 font-medium">{event.subtitle}</p>
            <div className="bg-white/5 p-6 rounded-2xl text-sm text-slate-300 text-center leading-relaxed font-light">
                {event.description}
                <div className="mt-4 pt-4 border-t border-white/10 text-[#C64928] text-sm md:text-base font-bold uppercase tracking-widest">
                    🗓️ {new Date(event.date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
            </div>
        </div>

        <form action={handleSubmitWrapper} ref={formRef} noValidate className="space-y-8">
            
            {/* 1. INFORMACIÓN DE PAGO (DISEÑO TIPO TICKET LIMPIO) */}
            <div className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100">
                <h3 className="font-heading text-3xl uppercase mb-8 text-slate-800 border-b border-slate-100 pb-4">1. Datos de Transferencia</h3>
                
                <div className="flex flex-col md:flex-row gap-8">
                    
                    {/* COLUMNA IZQUIERDA: PRECIO Y CONTACTO */}
                    <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col justify-center items-center text-center">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Inscripción</span>
                        <span className="text-5xl md:text-6xl font-heading font-bold text-[#1A1816] mt-2 mb-6">${event.price}</span>
                        
                        <div className="w-full pt-6 border-t border-slate-200">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Enviar comprobante a</span>
                            <span className="text-sm font-bold text-[#C64928] select-all">{contactInfo}</span>
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: DATOS DEL BANCO */}
                    <div className="flex-[2] flex flex-col justify-between">
                        <div className="grid grid-cols-2 gap-y-6 gap-x-4 mb-6">
                            <div className="col-span-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Titular</p>
                                <p className="text-lg font-bold text-slate-800 select-all">{event.bank_owner}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Banco</p>
                                <p className="text-base font-medium text-slate-700 select-all">{event.bank_name}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cuenta</p>
                                <p className="text-base font-medium text-slate-700 select-all">{displayType}</p>
                            </div>
                        </div>

                        {/* RUT Y NÚMERO DE CUENTA DESTACADOS */}
                        <div className="bg-[#1A1816] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row gap-4 sm:gap-6 items-start sm:items-center justify-between border-l-4 border-[#C64928]">
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">RUT</p>
                                <p className="text-xl font-mono font-medium text-slate-200 select-all tracking-wider">{event.bank_rut}</p>
                            </div>
                            <div className="w-full sm:w-px h-[1px] sm:h-10 bg-white/10"></div>
                            <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">N° de Cuenta</p>
                                <p className="text-2xl font-mono font-bold text-white select-all tracking-wider">{displayNumber}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. DATOS CORREDOR (LIMPIO Y PROPORCIONADO) */}
            <div id="ficha-corredor" className="bg-white p-8 md:p-10 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 scroll-mt-6">
                <h3 className="font-heading text-3xl uppercase mb-8 text-slate-800 border-b border-slate-100 pb-4">2. Ficha del Corredor</h3>
                
                {(state.message || Object.keys(errors).length > 0) && (
                    <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl mb-8 text-sm flex items-start gap-3">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <div>
                            <p className="font-bold">Información incompleta</p>
                            <p className="mt-1 opacity-90">{state.message || "Revisa los campos marcados en rojo e inténtalo de nuevo."}</p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Correo Electrónico *</label>
                        <input type="email" name="email" value={formValues.email} onChange={handleChange} className={inputClass('email')} placeholder="tu@correo.com" required />
                    </div>
                    <div>
                        <label className={labelClass}>Nombre Completo *</label>
                        <input type="text" name="full_name" value={formValues.full_name} onChange={handleChange} className={inputClass('full_name')} placeholder="Ej: Juan Pérez" required />
                    </div>
                    <div>
                        <label className={labelClass}>RUT *</label>
                        <input type="text" name="rut" value={formValues.rut} onChange={handleChange} className={inputClass('rut')} placeholder="11.111.111-K" maxLength={12} required />
                    </div>
                    <div>
                        <label className={labelClass}>Club / Team *</label>
                        {!isManualClub ? (
                            <select name="club" value={formValues.club} onChange={(e) => e.target.value === 'OTHER_MANUAL_INPUT' ? (setIsManualClub(true), setFormValues(p=>({...p, club:''}))) : setFormValues(p=>({...p, club:e.target.value}))} className={inputClass('club')}>
                                <option value="INDEPENDIENTE / LIBRE">INDEPENDIENTE / LIBRE</option>
                                {clubsList.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="OTHER_MANUAL_INPUT" className="font-bold text-[#C64928]">OTRO / NO LISTADO</option>
                            </select>
                        ) : (
                            <div className="relative">
                                <input type="text" name="club" value={formValues.club} onChange={handleChange} className={inputClass('club')} placeholder="Escribe el nombre de tu club" autoFocus required />
                                <button type="button" onClick={() => (setIsManualClub(false), setFormValues(p=>({...p, club:'INDEPENDIENTE / LIBRE'})))} className="absolute right-2 top-2 bottom-2 px-3 bg-slate-200 text-[10px] font-bold uppercase rounded-lg hover:bg-slate-300 transition-colors">Volver</button>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className={labelClass}>Ciudad de Residencia *</label>
                        <input type="text" name="ciudad" value={formValues.ciudad} onChange={handleChange} className={inputClass('ciudad')} placeholder="Ej: Santiago" required />
                    </div>
                    
                    <div>
                        <label className={labelClass}>Teléfono *</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium border-r border-slate-200 pr-3">+56</span>
                            <input type="tel" name="phone" value={formValues.phone} onChange={handleChange} className={`${inputClass('phone')} pl-[4rem]`} placeholder="912345678" maxLength={9} required />
                        </div>
                        {errors.phone && <span className="text-[10px] text-red-500 font-medium mt-1 ml-1 block">{errors.phone}</span>}
                    </div>
                    <div>
                        <label className={labelClass}>Instagram <span className="text-slate-400 font-normal lowercase">(Opcional)</span></label>
                        <input type="text" name="instagram" value={formValues.instagram} onChange={handleChange} className={inputClass('instagram')} placeholder="@usuario" />
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Fecha de Nacimiento *</label>
                        <input type="date" name="birth_date" value={formValues.birth_date} onChange={handleChange} className={inputClass('birth_date')} required />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Categoría Oficial *</label>
                        <select name="category_selected" value={formValues.category_selected} onChange={handleChange} className={inputClass('category_selected')} required>
                            <option value="" disabled>-- Selecciona tu categoría --</option>
                            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                    </div>
                </div>
            </div>

            {/* 3. REGLAMENTO */}
            <div className="bg-[#1A1816] text-slate-300 p-8 md:p-12 rounded-3xl shadow-xl">
                <h3 className="font-heading text-3xl uppercase mb-6 text-white border-b border-white/10 pb-4">3. Declaración y Reglamento</h3>
                <div className="h-64 overflow-y-auto pr-4 text-[13px] space-y-4 bg-white/5 p-6 rounded-2xl border border-white/5 text-justify leading-relaxed font-light scrollbar-thin scrollbar-thumb-slate-700">
                    {event.terms_conditions?.split('\n').map((para, i) => para.trim() !== '' && <p key={i}>{para}</p>)}
                </div>

                <label className="flex items-start md:items-center gap-4 mt-6 p-5 rounded-2xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors group">
                    <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-1 md:mt-0 h-6 w-6 rounded text-[#C64928] focus:ring-[#C64928] bg-black/50 border-white/20 cursor-pointer shrink-0" required />
                    <div className="flex flex-col">
                        <span className="font-medium text-white text-sm">Acepto los términos, condiciones y libero de responsabilidad a la organización.</span>
                        <span className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 group-hover:text-slate-400 transition-colors">Requerido para inscribirse</span>
                    </div>
                </label>
            </div>

            {/* BOTÓN PROPORCIONADO */}
            <button type="submit" disabled={isPending || !accepted} className="w-full bg-[#C64928] hover:bg-[#a63b1f] text-white font-bold text-lg md:text-xl uppercase tracking-widest py-6 rounded-2xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-[0.99]">
                {isPending ? 'Procesando Inscripción...' : 'Confirmar e Inscribirme'}
            </button>
        </form>

        <footer className="text-center pt-8 pb-12">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">© 2026 CHASKI RIDERS • CYCLES FRANKLIN</p>
        </footer>
      </div>
    </div>
  );
}