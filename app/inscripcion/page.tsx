'use client';

import { useActionState, useState, useEffect, useRef } from 'react';
import { submitRegistration, type RegisterState } from '@/actions/register';
import { Teko, Montserrat } from "next/font/google";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const teko = Teko({ subsets: ["latin"], weight: ["400", "600"], variable: '--font-teko' });
const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-montserrat' });

const initialState: RegisterState = { message: null, success: false, fields: {} };

export default function InscripcionPage() {
  const [state, formAction, isPending] = useActionState(submitRegistration, initialState);
  
  // ESTADO LOCAL: Preserva los datos ante errores del servidor
  const [formValues, setFormValues] = useState({
    email: '',
    full_name: '',
    rut: '',
    club: 'INDEPENDIENTE / LIBRE', // <--- CAMBIO: Preseleccionado por defecto
    ciudad: '',
    phone: '',
    birth_date: '',
    category: '',
    instagram: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [accepted, setAccepted] = useState(false);
  const [clubsList, setClubsList] = useState<string[]>([]);
  
  // Nuevo estado: Controla si el usuario está ingresando un club manual
  const [isManualClub, setIsManualClub] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const fetchClubs = async () => {
      const { data } = await supabase.from('clubs').select('name').order('name');
      if (data) setClubsList(data.map(c => c.name));
    };
    fetchClubs();
  }, []);

  // Lógica de formateo de RUT (11.111.111-K)
  const formatRut = (value: string) => {
    // Eliminar todo lo que no sea número o K
    let clean = value.replace(/[^0-9kK]/g, '');
    
    // Limitar largo máximo (aprox 9 caracteres para rut chileno estándar sin puntos ni guion)
    if (clean.length > 9) clean = clean.slice(0, 9);
    
    if (clean.length <= 1) return clean;

    // Separar cuerpo y dígito verificador
    const body = clean.slice(0, -1);
    const dv = clean.slice(-1).toUpperCase();

    // Agregar puntos al cuerpo
    let formattedBody = "";
    for (let i = body.length - 1, j = 0; i >= 0; i--, j++) {
        if (j > 0 && j % 3 === 0) {
            formattedBody = "." + formattedBody;
        }
        formattedBody = body[i] + formattedBody;
    }

    return `${formattedBody}-${dv}`;
  };

  // Función Centralizada de Cambios (Maneja Formateo y Estado)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    let finalValue = value;

    // Si es el campo RUT, aplicamos el formateo
    if (name === 'rut') {
        finalValue = formatRut(value);
    }

    setFormValues(prev => ({ ...prev, [name]: finalValue }));
    
    // Limpiar error al escribir
    if (errors[name]) {
        setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // Manejador específico para el cambio de modo Club
  const handleClubSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      if (val === 'OTHER_MANUAL_INPUT') {
          setIsManualClub(true);
          setFormValues(prev => ({ ...prev, club: '' })); // Limpiamos para que escriba
      } else {
          setIsManualClub(false);
          setFormValues(prev => ({ ...prev, club: val }));
      }
  };

  const checkRut = (rut: string) => {
    const cleanRut = rut.replace(/\./g, '').replace(/\s/g, '');
    if (!/^[0-9]+-[0-9kK]{1}$/.test(cleanRut)) return false;
    const [body, dv] = cleanRut.split('-');
    let sum = 0;
    let multiplier = 2;
    for (let i = body.length - 1; i >= 0; i--) {
      sum += parseInt(body.charAt(i)) * multiplier;
      multiplier = multiplier === 7 ? 2 : multiplier + 1;
    }
    const expectedDv = 11 - (sum % 11);
    const calcDv = expectedDv === 11 ? '0' : expectedDv === 10 ? 'K' : expectedDv.toString();
    return calcDv === dv.toUpperCase();
  };

  const validateField = (name: string, value: string) => {
    let error = "";
    if (name === 'rut') {
      if (!value) error = "El RUT es obligatorio";
      else if (!checkRut(value)) error = "RUT inválido (Revisa el dígito verificador)";
    }
    if (name === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = "Email inválido";
    if (name === 'phone' && value && value.length < 9) error = "Mínimo 9 dígitos";
    setErrors(prev => ({ ...prev, [name]: error }));
  };

  const handleSubmit = (formData: FormData) => {
    const newErrors: Record<string, string> = {};
    const required = ['email', 'full_name', 'rut', 'club', 'ciudad', 'phone', 'birth_date', 'category'];
    
    required.forEach(field => {
      if (!formData.get(field)) newErrors[field] = "Este campo es obligatorio";
    });

    const rut = formData.get('rut') as string;
    if (rut && !checkRut(rut)) newErrors['rut'] = "RUT inválido";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstError = document.getElementsByName(Object.keys(newErrors)[0])[0];
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    formAction(formData);
  };

  const labelClass = "block text-xs font-bold uppercase text-slate-600 mb-1.5 tracking-wider ml-1";
  const inputClass = (name: string) => `w-full p-3.5 bg-white text-slate-900 rounded-xl border-2 transition-all font-semibold placeholder:text-slate-300 ${
    errors[name] ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-[#C64928] focus:ring-4 focus:ring-orange-50/50 outline-none'
  }`;

  if (state.success) {
    return (
      <div className={`min-h-screen bg-[#1A1816] flex items-center justify-center p-4 ${montserrat.variable} ${teko.variable} font-sans text-center`}>
        <div className="bg-white p-12 rounded-[2.5rem] shadow-2xl max-w-lg w-full border-b-[8px] border-[#C64928]">
          <h2 className="text-6xl font-bold uppercase italic mb-4 text-[#C64928] tracking-tighter">¡Registro Exitoso!</h2>
          <p className="text-slate-600 font-medium mb-8 text-lg">Tu ficha ha sido guardada. Por favor envía tu comprobante al WhatsApp para validar la inscripción.</p>
          <Link href="/" className="inline-block bg-[#1A1816] text-white font-bold py-4 px-12 rounded-xl text-sm uppercase tracking-widest hover:bg-[#C64928] transition-colors">Volver al Inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-[#F8FAFC] py-8 md:py-16 px-3 ${montserrat.variable} ${teko.variable} font-sans text-slate-800`}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="bg-[#1A1816] text-white p-8 md:p-12 rounded-t-[3rem] rounded-b-3xl shadow-2xl text-center mb-10 border-b-[8px] border-[#C64928] relative overflow-hidden">
            <div className="relative z-10">
                <h1 className="font-heading text-6xl md:text-8xl uppercase italic leading-none mb-2 tracking-tighter">
                    PAMPA <span className="text-[#C64928]">Y MAR</span>
                </h1>
                <p className="font-heading text-xl md:text-3xl text-slate-400 uppercase tracking-[0.2em] mb-8">
                    CYCLES FRANKLIN • IV CAMPEONATO REGIONAL TARAPACÁ
                </p>
                <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl text-xs md:text-sm text-slate-200 text-justify font-normal border border-white/10 leading-relaxed space-y-3">
                    <p>Este evento deportivo consiste en una carrera de ciclismo de montaña (XCM), a desarrollarse en la región de Tarapacá, desde el sector de la Huayca en la comuna de Pozo Almonte hasta el sector de tres islas en la comuna de Iquique.</p>
                    <p>La longitud de esta carrera es de aproximadamente 80 k y una altimetría de 600 mts. Aproximadamente, con una dificultad media a media-alta, incluyendo algunos tramos técnicos, como es la bajada a la costa por el sector &quot;Paso la Mula&quot;.</p>
                    <p>El recorrido de esta carrera es en gran parte paralelo a las tuberías de agua y a la línea férrea que bajan a la ciudad de Iquique, pasando por algunas ruinas de las antiguas oficinas salitreras, dándole una connotación de homenaje a la historia de la región, uniendo la pampa del tamarugal, las calicheras y el mar.</p>
                    <p className="text-center pt-4 border-t border-white/20 mt-4">
                        Este evento es organizado por la agrupación <strong>TEAM CYCLES FRANKLIN</strong> de Alto Hospicio.<br/>
                        Estando también circunscrito dentro de lo que será el 4to campeonato regional de ciclismo de montaña (MTB) siendo la 1ra Fecha.
                    </p>
                    <p className="text-center pt-2 text-[#C64928] font-heading text-2xl uppercase">FECHA: SÁBADO 4 DE ABRIL DEL 2026</p>
                </div>
            </div>
        </div>

        {/* ALERTA DE ERROR DEL SERVIDOR */}
        {state.message && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r shadow-md mb-6 animate-pulse">
                <p className="font-bold">Atención:</p>
                <p>{state.message}</p>
            </div>
        )}

        <form 
            action={handleSubmit} 
            ref={formRef} 
            noValidate 
            className="space-y-6"
        >
            
            {/* 1. INFORMACIÓN DE PAGO */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-4 border-slate-200 text-center">
                <h3 className="font-heading text-4xl uppercase mb-6 text-slate-800 italic flex items-center justify-center gap-3">
                    <span className="bg-[#C64928] text-white w-10 h-10 flex items-center justify-center rounded-full not-italic text-xl shadow-md">1</span> 
                    Información de Transferencia
                </h3>
                <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-dashed border-slate-300 max-w-xl mx-auto">
                    <div className="mb-6">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">VALOR DE INSCRIPCIÓN</p>
                        <p className="text-7xl font-heading font-bold text-slate-900">$20.000</p>
                    </div>
                    <div className="space-y-3 text-slate-800 text-left bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                        <div>
                            <p className="text-[10px] text-[#C64928] uppercase font-bold tracking-wider mb-1">TITULAR</p>
                            <p className="text-xl font-bold uppercase leading-none">MARÍA TERESA VALENCIA PALACIOS</p>
                        </div>
                        <div className="flex justify-between items-end border-b border-slate-100 pb-3">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">RUT</p>
                                <p className="text-lg font-mono font-bold text-slate-700">12.835.496-4</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">BANCO</p>
                                <p className="text-lg font-bold text-slate-700">SANTANDER</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">CUENTA</p>
                            <p className="text-lg font-bold">Chequera Electrónica: <span className="text-2xl ml-2 tracking-wider">5612835496</span></p>
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">CORREO</p>
                            <p className="text-sm font-bold text-slate-600 lowercase select-all">Mteresavalenciapalacios@gmail.com</p>
                        </div>
                    </div>
                </div>
                <div className="mt-8 inline-flex items-center gap-3 bg-slate-900 text-white py-3 px-8 rounded-full shadow-lg">
                    <span className="text-xl">📱</span>
                    <div className="text-left leading-tight">
                        <p className="text-[9px] font-bold uppercase text-slate-400">Enviar Comprobante al</p>
                        <p className="text-base font-bold tracking-wider">+56 9 2633 6663</p>
                    </div>
                </div>
            </div>

            {/* 2. FICHA TÉCNICA */}
            <div className="bg-white p-8 rounded-[2.5rem] shadow-lg border-b-4 border-slate-200">
                <h3 className="font-heading text-4xl uppercase mb-8 text-slate-800 italic flex items-center gap-3">
                    <span className="bg-[#C64928] text-white w-10 h-10 flex items-center justify-center rounded-full not-italic text-xl shadow-md">2</span> 
                    Datos del Corredor
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className={labelClass}>Correo Electrónico *</label>
                        <input 
                            type="email" 
                            name="email" 
                            required 
                            value={formValues.email} 
                            onChange={handleChange}
                            className={inputClass('email')} 
                            onBlur={(e) => validateField('email', e.target.value)} 
                            placeholder="tu@correo.com" 
                        />
                        {errors.email && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.email}</span>}
                    </div>
                    <div>
                        <label className={labelClass}>Nombre y Apellidos *</label>
                        <input 
                            type="text" 
                            name="full_name" 
                            required 
                            value={formValues.full_name} 
                            onChange={handleChange}
                            className={inputClass('full_name')} 
                            placeholder="Nombre completo" 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>RUT (Automático) *</label>
                        <input 
                            type="text" 
                            name="rut" 
                            required 
                            value={formValues.rut} 
                            onChange={handleChange}
                            className={inputClass('rut')} 
                            onBlur={(e) => validateField('rut', e.target.value)} 
                            placeholder="11.111.111-K" 
                            maxLength={12} 
                        />
                        {errors.rut && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.rut}</span>}
                    </div>
                    
                    {/* CAMPO DE SELECCIÓN DE CLUB PRESELECCIONADO */}
                    <div>
                        <label className={labelClass}>Club / Team *</label>
                        {!isManualClub ? (
                            <select 
                                name="club"
                                required 
                                value={formValues.club} 
                                onChange={handleClubSelectChange}
                                className={inputClass('club')}
                            >
                                <option value="" disabled>-- Selecciona tu Team --</option>
                                <option value="INDEPENDIENTE / LIBRE">INDEPENDIENTE / LIBRE</option>
                                {clubsList.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="OTHER_MANUAL_INPUT" className="font-bold text-[#C64928]">OTRO / NO ESTÁ EN LA LISTA</option>
                            </select>
                        ) : (
                            <div className="relative animate-in fade-in slide-in-from-top-2 duration-300">
                                <input 
                                    type="text"
                                    name="club"
                                    required
                                    value={formValues.club}
                                    onChange={handleChange}
                                    className={`${inputClass('club')} pr-24`} 
                                    placeholder="Escribe el nombre de tu Team..."
                                    autoFocus
                                />
                                <button 
                                    type="button" 
                                    onClick={() => { setIsManualClub(false); setFormValues(p => ({...p, club: 'INDEPENDIENTE / LIBRE'})) }}
                                    className="absolute right-2 top-2 bottom-2 px-3 bg-slate-200 hover:bg-slate-300 text-slate-600 text-[10px] font-bold uppercase rounded-lg transition-colors"
                                >
                                    Volver a Lista
                                </button>
                            </div>
                        )}
                        {errors.club && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.club}</span>}
                    </div>

                    <div>
                        <label className={labelClass}>Ciudad de Residencia *</label>
                        <input 
                            type="text" 
                            name="ciudad" 
                            required 
                            value={formValues.ciudad} 
                            onChange={handleChange}
                            className={inputClass('ciudad')} 
                            placeholder="Ej: Iquique" 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Número de Contacto *</label>
                        <input 
                            type="tel" 
                            name="phone" 
                            required 
                            value={formValues.phone} 
                            onChange={handleChange}
                            className={inputClass('phone')} 
                            onBlur={(e) => validateField('phone', e.target.value)} 
                            placeholder="912345678" 
                        />
                        {errors.phone && <span className="text-[10px] text-red-500 font-bold mt-1 uppercase ml-1">{errors.phone}</span>}
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Fecha de Nacimiento (Para cálculo de edad) *</label>
                        <input 
                            type="date" 
                            name="birth_date" 
                            required 
                            value={formValues.birth_date} 
                            onChange={handleChange}
                            className={inputClass('birth_date')} 
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Categoría Oficial *</label>
                        <select 
                            name="category" 
                            required 
                            value={formValues.category} 
                            onChange={handleChange}
                            className={inputClass('category')}
                        >
                            <option value="" disabled>-- Selecciona tu Categoría --</option>
                            <optgroup label="VARONES" className="font-bold text-slate-900">
                                {["Elite Open", "Pre Master (16 a 29 Años)", "Master A (30 a 39 Años)", "Master B (40 a 49 Años)", "Master C (50 a 59 Años)", "Master D (60 Años y Más)", "Novicios Open (Recien empezando)"].map(v => <option key={v} value={v}>{v}</option>)}
                            </optgroup>
                            <optgroup label="DAMAS" className="font-bold text-slate-900">
                                {["Novicias Open (Recién empezando)", "Damas Pre Master (15 a 29 Años)", "Damas Master A (30 a 39 Años)", "Damas Master B (40 a 49 Años)", "Damas Master C (50 Años y más)"].map(d => <option key={d} value={d}>{d}</option>)}
                            </optgroup>
                            <optgroup label="MIXTAS" className="font-bold text-slate-900">
                                <option value="EBike Mixto Open">E-Bike Open Mixto (Sin restricciones)</option>
                                <option value="Enduro Mixto Open">Enduro Open Mixto (Horquilla 140mm+)</option>
                            </optgroup>
                        </select>
                    </div>
                    <div className="md:col-span-2">
                        <label className={labelClass}>Instagram (Opcional)</label>
                        <input 
                            type="text" 
                            name="instagram" 
                            value={formValues.instagram} 
                            onChange={handleChange}
                            className={inputClass('instagram')} 
                            placeholder="@usuario" 
                        />
                    </div>
                </div>
            </div>

            {/* 3. REGLAMENTO INTEGRAL */}
            <div className="bg-[#1A1816] text-slate-300 p-8 md:p-12 rounded-[2.5rem] shadow-2xl border-b-8 border-[#C64928]">
                <h3 className="font-heading text-3xl uppercase mb-6 text-white italic border-b border-white/10 pb-4">Declaración Jurada y Reglamento</h3>
                <div className="h-96 overflow-y-auto pr-3 text-[11px] md:text-xs space-y-4 bg-white/5 p-6 rounded-2xl border border-white/10 text-justify leading-relaxed font-normal scrollbar-thin scrollbar-thumb-[#C64928] scrollbar-track-transparent">
                    <p className="font-bold text-white mb-2">Declaro bajo juramento lo siguiente:</p>
                    <p><strong className="text-[#C64928]">1.</strong> Que me encuentro (o mi representado se encuentra) en condiciones físicas y mentales de salud aptas para participar en el evento denominado &quot;XCM Pampa y Mar, correspondiente a la 1ra Fecha del IV Campeonato Regional Tarapacá 2026&quot;, actividad que se desarrollará en las comunas de Pozo Almonte, Iquique y Alto Hospicio organizada por el Team Cycles Franklin.</p>
                    <p><strong className="text-[#C64928]">2.</strong> Por el sólo hecho de inscribirse a la carrera &quot;XCM Pampa y Mar, correspondiente a la 1ra Fecha del IV Campeonato Regional Tarapacá 2026&quot;, declaro estar en conocimiento y acepto cada aspecto y condición indicado en el presente reglamento, a respetar y cumplir todas las medidas de seguridad establecidas por la organización, además de las instrucciones que serán impartidas antes, durante y después del evento, sea por sus organizadores o por cualquier autoridad.</p>
                    <p><strong className="text-[#C64928]">3.</strong> Relevo y eximo totalmente de toda responsabilidad a los organizadores, promotores y/o auspiciadores del evento, por la ocurrencia de cualquier accidente en que el declarante (o mi representado) pueda verse involucrado con ocasión de mi (su) participación en el evento, y de todo tipo de daño y perjuicio que de éste pueda derivarse, en especial en caso de incumplimiento de las instrucciones que sean impartidas. Los sectores del circuito por donde circulan los competidores, están debidamente marcados y se prohíbe al público que acompañe a los corredores, transitar por ellos.</p>
                    <p><strong className="text-[#C64928]">4.</strong> En caso de retirarme o hacer abandono en medio de la ruta debo notificar lo antes posible al personal del staff u otro corredor para que de aviso. De no hacerlo podría activar los protocolos de búsqueda y salvataje de las autoridades. No dar aviso de abandono de la prueba es una falta grave y puedo ser privado de participar en otras versiones de la carrera u otros eventos de los organizadores.</p>
                    <p><strong className="text-[#C64928]">5.</strong> El uso del casco es obligatorio, el no cumplimiento será motivo de no participación y o descalificación. Es obligatorio tener una bicicleta en buen estado y diseñada para este tipo de desafío, llevar además de llevar el kit de reparación, no se permitirá el uso de cualquier tipo de cámara de grabación en el casco y de audífonos durante la carrera. Se debe portar el número de competencia en la parte delantera de la bicicleta durante toda la carrera, visible en todo momento y no puede ser recortado ni alterado de ninguna forma.</p>
                    <p><strong className="text-[#C64928]">6.</strong> Existirá apoyo de un vehículo para transporte. El personal paramédico de la competencia tiene el poder de decisión para retirar a un competidor de la carrera que se encuentre en condiciones físicas de riesgo.</p>
                    <p><strong className="text-[#C64928]">7.</strong> En caso de que no pueda participar por un problema de salud u otro, el dinero no será reembolsado, solo se podrá traspasar la inscripción a otro corredor, el cual asume todo lo descrito en este reglamento, para esto deberá avisar a la organización con 48hrs., de anticipación, y el nuevo corredor deberá presentar un poder simple al retiro del kit de competidor, esto podrá realizar por una única vez.</p>
                    <p><strong className="text-[#C64928]">8.</strong> Cualquier conducta antideportiva y/o maltrato físico o verbal a personal de la competencia será motivo de descalificación inmediata.</p>
                    <p><strong className="text-[#C64928]">9.</strong> La entrega de kit y reunión técnica será el día previo de la competencia, en esta se darán las últimas instrucciones, se informará los cambios de última hora (si los hubiese) y todos aquellos temas contingentes a la competencia.</p>
                    <p><strong className="text-[#C64928]">10.</strong> Autorizo expresamente a los organizadores, promotores y/o auspiciadores del evento, para que utilicen las imágenes fotográficas y/o de video que se registren antes, durante o después del mismo, en las cuales pudiese aparecer el declarante (o mi representado), facultándolos además para utilizar y/o transferir los datos que han sido aportados en el presente instrumento, de conformidad a lo dispuesto en el artículo 4° de la Ley N° 19.628.</p>
                    <p><strong className="text-[#C64928]">11.</strong> Las categorías novicios y novicias. Se considera en esta categoría todo competidor que se esta recien iniciando en el MTB y que no haya participado en carreras anteriormente o que no haya participado en el Campeonato regional Tarapacá en sus versiones anteriores. De inscribirse en esta categoría un ciclista avanzado no podrá optar a pódium.</p>
                    <p><strong className="text-[#C64928]">12.</strong> La Categoría enduro considera las bicicletas cuya horquilla tiene 140mm a más.</p>
                    <p><strong className="text-[#C64928]">13.</strong> La Categoría Ebike podrá realizar cambio de batería durante la competencia, pero es responsabilidad del competidor la asistencia de esta.</p>
                    <p><strong className="text-[#C64928]">14.</strong> Se premiarán los 5 primeros de cada categoría.</p>
                    <p><strong className="text-[#C64928]">15.</strong> Si te inscribes en una categoría distinta de la que has participado en el presente campeonato, perderás puntaje acumulado a la fecha, por lo que te recomendamos mantener tu categoría.</p>
                    <p><strong className="text-[#C64928]">16.</strong> Todo reclamo posterior a la carrera debera ser de manera formal y por escrito al correo de la organización con un plazo no posterior a 24 horas una vez finalizada la carrera, su respuesta sera en un plazo maximo de 24 hrs.</p>
                    <p><strong className="text-[#C64928]">17.</strong> Puntuación: En cada fecha se otorgará un puntuaje según su posición de llegada en la categoría, este será 1ro 100; 2do 90; 3ro 80; 4to 70; 5to 60; 6to 50; 7mo 40; 8vo 30; 9no 20; 10mo 10; 11vo 9 y asi sucesivamente.</p>
                    <p><strong className="text-[#C64928]">18.</strong> El presente formulario podría tener modificaciones respecto de sus condiciones y normas asociadas a el circuito &quot;XCM Pampa y Mar, correspondiente a la 1ra Fecha del IV Campeonato Regional Tarapacá 2026&quot;.</p>
                    <p className="font-bold text-white pt-4 border-t border-white/10 text-center uppercase tracking-widest italic mt-4">Declaro haber leído y entendido de manera íntegra el presente documento y que los datos que he incorporado al mismo son veraces, haciéndome en todo caso plenamente responsable por la inclusión de los antecedentes que no lo sean.</p>
                    <p className="text-right text-xs mt-2 italic text-[#C64928]">Atte. Franklin Troncoso. Organizador</p>
                </div>

                <label className="flex items-center gap-4 cursor-pointer group mt-6 p-5 rounded-2xl bg-[#C64928]/10 hover:bg-[#C64928]/20 border border-[#C64928]/30 transition-all shadow-inner">
                    <input 
                      type="checkbox" 
                      name="terms_accepted" 
                      required 
                      checked={accepted} 
                      onChange={(e) => setAccepted(e.target.checked)} 
                      className="h-8 w-8 rounded-lg accent-[#C64928] cursor-pointer bg-white" 
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-white uppercase text-sm italic tracking-wide">Sí, Acepto y firmo bajo juramento</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Requerido para activar el botón</span>
                    </div>
                </label>
            </div>

            <button 
                type="submit" 
                disabled={isPending || !accepted} 
                className="w-full bg-[#C64928] hover:bg-[#1A1816] text-white font-heading text-5xl uppercase py-8 rounded-[2rem] shadow-[0_15px_40px_rgba(198,73,40,0.4)] transition-all transform hover:scale-[1.01] active:scale-95 disabled:opacity-30 disabled:grayscale italic tracking-tighter border-b-[8px] border-orange-900 leading-none"
            >
                {isPending ? 'Enviando...' : 'Confirmar e Inscribirme'}
            </button>
        </form>

        <footer className="text-center py-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">© 2026 CHASKI RIDERS • CYCLES FRANKLIN</p>
        </footer>
      </div>
    </div>
  );
}