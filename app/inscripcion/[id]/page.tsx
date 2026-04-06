'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { submitRegistration, type RegisterState } from '@/actions/register';
import { Teko, Montserrat } from "next/font/google";
import { supabase } from '@/lib/supabase';
import { Event } from '@/lib/definitions';
import Link from 'next/link';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-montserrat' });

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
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);

  const labelClass = "block text-xs font-bold uppercase text-slate-600 mb-1.5 tracking-wider ml-1";
  const inputClass = (name: string) => `w-full p-3.5 bg-white text-slate-900 rounded-xl border-2 transition-all font-semibold placeholder:text-slate-300 ${
    errors[name] ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-[#C64928] focus:ring-4 focus:ring-orange-50/50 outline-none'
  }`;

  useEffect(() => {
    const fetchData = async () => {
      const hoy = new Date().toISOString().split('T')[0];
      const { data: eventData } = await supabase
        .from('events').select('*').eq('status', 'pending').gte('date', hoy).order('date', { ascending: true }).limit(1).single();

      if (eventData) setEvent(eventData as Event);
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
    const finalValue = name === 'rut' ? formatRut(value) : value;
    setFormValues(prev => ({ ...prev, [name]: finalValue }));
    if (errors[name]) setErrors(prev => { const n = {...prev}; delete n[name]; return n; });
  };

  const handleSubmitWrapper = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    const required = ['email', 'full_name', 'rut', 'club', 'ciudad', 'phone', 'birth_date', 'category_selected'];
    required.forEach(field => { if (!formData.get(field)) newErrors[field] = "Obligatorio"; });
    const rut = formData.get('rut') as string;
    if (rut && !checkRut(rut)) newErrors['rut'] = "RUT inválido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      document.getElementsByName(Object.keys(newErrors)[0])[0]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (event?.id) formData.append('event_id', event.id);
    formAction(formData);
  };

  if (loading) return <div className="min-h-screen bg-[#1A1816] flex items-center justify-center text-white font-heading text-4xl animate-pulse uppercase">Cargando...</div>;
  if (!event) return <div className="min-h-screen bg-[#1A1816] flex items-center justify-center text-white font-heading text-4xl italic text-center px-4">SIN EVENTOS ABIERTOS</div>;

  // Tipado para acceder al contacto de pago
  const formConfig = event.form_config as EventFormConfig | null;
  const categories = formConfig?.categories ?? BACKUP_CATEGORIES;
  const contactInfo = formConfig?.payment_contact ?? 'Mteresavalenciapalacios@gmail.com';

  const accountInfo = event.bank_account || '';
  const hasSeparator = accountInfo.includes(' - ');
  const displayType = hasSeparator ? accountInfo.split(' - ')[0] : 'TIPO DE CUENTA';
  const displayNumber = hasSeparator ? accountInfo.split(' - ')[1] : accountInfo;

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-6 px-3 md:py-16 ${montserrat.variable} ${teko.variable} font-sans text-slate-800 flex flex-col`}>
      <div className="max-w-4xl mx-auto w-full space-y-6 md:space-y-8 flex-grow">
        
        {/* HEADER */}
        <div className="bg-[#1A1816] text-white p-6 md:p-12 rounded-t-[2.5rem] rounded-b-3xl shadow-2xl text-center border-b-[8px] border-[#C64928]">
            <h1 className="font-heading text-5xl md:text-8xl uppercase italic leading-none mb-2 tracking-tighter">
                {event.name.split(' ').slice(0,-1).join(' ')} <span className="text-[#C64928]">{event.name.split(' ').pop()}</span>
            </h1>
            <p className="font-heading text-lg md:text-3xl text-slate-400 uppercase tracking-widest mb-6 leading-tight">{event.subtitle}</p>
            <div className="bg-white/10 p-5 rounded-2xl text-xs md:text-sm text-slate-200 text-justify border border-white/10 whitespace-pre-line leading-relaxed">
                {event.description}
                <p className="text-center pt-4 border-t border-white/20 mt-4 text-[#C64928] font-heading text-xl md:text-2xl uppercase font-bold">FECHA: {new Date(event.date + 'T00:00:00').toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()}</p>
            </div>
        </div>

        <form action={handleSubmitWrapper} ref={formRef} noValidate className="space-y-8">
            
            {/* 1. INFORMACIÓN DE PAGO */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-[#C64928]"></div>
                <h3 className="font-heading text-3xl md:text-4xl uppercase mb-8 text-slate-800 italic">1. Información de Transferencia</h3>
                
                <div className="max-w-xl mx-auto">
                    <div className="mb-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">VALOR DE INSCRIPCIÓN</p>
                        <p className="text-7xl md:text-8xl font-heading font-bold text-[#1A1816] tracking-tighter">${event.price}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        <div className="md:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-[#C64928] uppercase tracking-widest mb-1">TITULAR</p>
                            <p className="text-xl font-bold text-slate-800 uppercase leading-none">{event.bank_owner}</p>
                            <p className="text-sm font-medium text-slate-500 mt-1">RUT: {event.bank_rut}</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">BANCO</p>
                            <p className="text-lg font-bold text-slate-800 uppercase">{event.bank_name}</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl border border-black shadow-inner">
                            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">{displayType}</p>
                            <p className="text-2xl font-heading font-bold text-white tracking-wider">{displayNumber}</p>
                        </div>
                    </div>

                    {/* ✅ CONTACTO DINÁMICO */}
                    <div className="mt-8 flex flex-col md:flex-row items-center justify-center gap-3 py-4 border-t border-slate-100">
                        <div className="flex items-center gap-2 text-slate-400">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] font-bold uppercase tracking-widest">Enviar comprobante a:</span>
                        </div>
                        <p className="text-sm font-bold text-slate-700 select-all">{contactInfo}</p>
                    </div>
                </div>
            </div>

            {/* 2. DATOS CORREDOR */}
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <h3 className="font-heading text-3xl md:text-4xl uppercase mb-8 text-slate-800 italic">2. Ficha del Corredor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Correo Electrónico *</label>
                        <input type="email" name="email" required value={formValues.email} onChange={handleChange} className={inputClass('email')} placeholder="ejemplo@correo.com" />
                    </div>
                    <div><label className={labelClass}>Nombre y Apellidos *</label><input type="text" name="full_name" required value={formValues.full_name} onChange={handleChange} className={inputClass('full_name')} /></div>
                    <div><label className={labelClass}>RUT *</label><input type="text" name="rut" required value={formValues.rut} onChange={handleChange} className={inputClass('rut')} maxLength={12} /></div>
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
                                <input type="text" name="club" value={formValues.club} onChange={handleChange} className={inputClass('club')} autoFocus required />
                                <button type="button" onClick={() => (setIsManualClub(false), setFormValues(p=>({...p, club:'INDEPENDIENTE / LIBRE'})))} className="absolute right-2 top-2 bottom-2 px-3 bg-slate-200 text-[10px] font-bold uppercase rounded-lg">Volver</button>
                            </div>
                        )}
                    </div>
                    <div><label className={labelClass}>Ciudad *</label><input type="text" name="ciudad" value={formValues.ciudad} onChange={handleChange} className={inputClass('ciudad')} required /></div>
                    <div><label className={labelClass}>Teléfono *</label><input type="tel" name="phone" value={formValues.phone} onChange={handleChange} className={inputClass('phone')} required /></div>
                    <div className="md:col-span-2"><label className={labelClass}>Fecha de Nacimiento *</label><input type="date" name="birth_date" value={formValues.birth_date} onChange={handleChange} className={inputClass('birth_date')} required /></div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Categoría Oficial *</label>
                        <select name="category_selected" value={formValues.category_selected} onChange={handleChange} className={inputClass('category_selected')} required>
                            <option value="" disabled>-- Elige tu categoría --</option>
                            {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
                        </select>
                    </div>
                    <div className="md:col-span-2"><label className={labelClass}>Instagram (Opcional)</label><input type="text" name="instagram" value={formValues.instagram} onChange={handleChange} className={inputClass('instagram')} placeholder="@tu_usuario" /></div>
                </div>
            </div>

            {/* 3. REGLAMENTO */}
            <div className="bg-[#1A1816] text-slate-300 p-6 md:p-12 rounded-[2.5rem] shadow-2xl border-b-8 border-[#C64928]">
                <h3 className="font-heading text-2xl md:text-3xl uppercase mb-6 text-white italic border-b border-white/10 pb-4">Reglamento</h3>
                <div className="h-80 overflow-y-auto pr-3 text-xs space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 text-justify leading-relaxed font-normal scrollbar-thin scrollbar-thumb-[#C64928]">
                    {event.terms_conditions?.split('\n').map((para, i) => para.trim() !== '' && <p key={i}>{para}</p>)}
                </div>

                <label className="flex items-center gap-4 mt-8 p-5 rounded-2xl bg-[#C64928]/10 border border-[#C64928]/30 cursor-pointer hover:bg-[#C64928]/20 transition-all">
                    <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="h-7 w-7 rounded-lg accent-[#C64928] cursor-pointer shrink-0" required />
                    <div className="flex flex-col">
                        <span className="font-bold text-white uppercase text-sm italic tracking-widest">Sí, Acepto y firmo bajo juramento</span>
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mt-1">Requerido para activar el botón</span>
                    </div>
                </label>
            </div>

            <button type="submit" disabled={isPending || !accepted} className="w-full bg-[#C64928] hover:bg-[#1A1816] text-white font-heading text-4xl md:text-5xl uppercase py-8 rounded-[2.5rem] shadow-xl disabled:opacity-20 italic border-b-[8px] border-orange-900 transition-all transform active:scale-95 leading-none">
                {isPending ? 'Procesando...' : 'Confirmar e Inscribirme'}
            </button>
        </form>

        <footer className="text-center py-10 opacity-30 font-bold uppercase text-[9px] tracking-[0.5em]">
          © 2026 CHASKI RIDERS • CYCLES FRANKLIN
        </footer>
      </div>
    </div>
  );
}