'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  getPendingRequests, 
  approveRequest, 
  rejectRequest,
  type RegistrationRequest 
} from '@/actions/admin';
import { Montserrat, Roboto_Mono, Teko } from "next/font/google";
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"], variable: '--font-montserrat' });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-mono' });
const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });

interface EditFields {
  full_name?: string;
  email?: string;
  rut?: string;
  birth_date?: string;
  club?: string;
  category?: string;
  phone?: string;
  instagram?: string;
}

interface ExistingRider {
  rut: string;
  email: string;
}

// Función para calcular la edad al 31 de diciembre de 2026 (Edad de competición UCI)
const calculateRacingAge2026 = (birthDateStr?: string) => {
  if (!birthDateStr) return null;
  const birthYear = new Date(birthDateStr).getFullYear();
  if (isNaN(birthYear)) return null;
  return 2026 - birthYear;
};

export default function AdminSolicitudes() {
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [clubs, setClubs] = useState<string[]>([]);
  const [existingRiders, setExistingRiders] = useState<ExistingRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, EditFields>>({});
  const [manualModeRows, setManualModeRows] = useState<Record<string, boolean>>({});

  const loadData = useCallback(async () => {
    try {
      const [reqData, clubData, riderData] = await Promise.all([
        getPendingRequests(),
        supabase.from('clubs').select('name').order('name'),
        supabase.from('riders').select('rut, email')
      ]);

      setRequests(reqData);
      setClubs(clubData.data ? clubData.data.map(c => c.name) : []);
      setExistingRiders(riderData.data ? riderData.data as ExistingRider[] : []);
    } catch (error) {
      console.error("Error en la carga de datos:", error);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleEdit = (id: string, field: keyof EditFields, value: string) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const handleClubChange = (id: string, value: string) => {
    if (value === '__MANUAL_MODE__') {
      setManualModeRows(prev => ({ ...prev, [id]: true }));
      handleEdit(id, 'club', '');
    } else {
      handleEdit(id, 'club', value);
    }
  };

  const revertToListMode = (id: string) => {
    setManualModeRows(prev => ({ ...prev, [id]: false }));
    handleEdit(id, 'club', 'INDEPENDIENTE / LIBRE');
  };

  const onApprove = async (req: RegistrationRequest, isDuplicate: boolean) => {
    const confirmMessage = isDuplicate 
      ? `ATENCIÓN: El rider con RUT ${req.rut} ya existe en el sistema. ¿Desea sincronizar y actualizar la ficha existente?`
      : `¿Confirmar aprobación de inscripción para ${req.full_name}?`;

    if (!confirm(confirmMessage)) return;
    
    setProcessing(req.id);
    try {
      const res = await approveRequest(req.id, edits[req.id]);
      
      if (res.success) {
        setRequests(prev => prev.filter(r => r.id !== req.id));
        setEdits(prev => {
          const next = { ...prev };
          delete next[req.id];
          return next;
        });
      } else {
        alert(`Error en el proceso: ${res.message}`);
      }
    } catch (err) {
      alert("Error crítico en el servidor de aplicaciones.");
    } finally {
      setProcessing(null);
      loadData();
    }
  };

  const onReject = async (req: RegistrationRequest) => {
    if (!confirm(`ADVERTENCIA: ¿Eliminar solicitud definitivamente? Los datos serán borrados.`)) return;
    setProcessing(req.id);
    try {
      const res = await rejectRequest(req.id);
      if (res.success) {
        setRequests(prev => prev.filter(r => r.id !== req.id));
      } else {
        alert(`Error al eliminar: ${res.message}`);
      }
    } finally {
      setProcessing(null);
    }
  };

  // Clases CSS para los inputs editables (Invisibles hasta que haces clic o pasas el mouse)
  const inputClass = "w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-[#C64928] focus:bg-white rounded-md px-2 py-1 outline-none transition-all placeholder:text-slate-300";

  return (
    <main className={`min-h-screen bg-[#F8FAFC] text-slate-800 ${montserrat.variable} ${teko.variable} ${mono.variable} font-sans pb-32`}>
      
      <header className="bg-[#1A1816] pt-12 pb-24 px-6 rounded-b-[40px] shadow-xl relative border-b-[6px] border-[#C64928]">
        <div className="max-w-[95rem] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <Link href="/admin" className="text-slate-400 hover:text-white text-[10px] font-bold uppercase tracking-[0.2em] mb-3 block transition-colors">
              ← Regresar al Panel
            </Link>
            <h1 className="font-heading text-5xl md:text-6xl text-white uppercase italic leading-none tracking-tighter">
              Solicitudes <span className="text-[#C64928]">Pendientes</span>
            </h1>
          </div>
          <div className="flex flex-col items-end bg-white/5 p-4 rounded-2xl border border-white/10">
            <span className="text-[#FFD700] font-heading text-5xl leading-none">{requests.length}</span>
            <span className="text-xs font-semibold uppercase text-slate-300 tracking-wider mt-1">En Espera</span>
          </div>
        </div>
      </header>

      <div className="max-w-[95rem] mx-auto px-4 -mt-12 relative z-20">
        
        {/* TEXTO ACLARATORIO */}
        {requests.length > 0 && (
          <div className="mb-4 flex flex-col md:flex-row items-start md:items-center bg-white border-l-4 border-blue-500 p-4 rounded-xl shadow-sm text-sm text-slate-600 animate-in fade-in duration-500">
            <svg className="w-5 h-5 text-blue-500 mr-3 hidden md:block flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>
              <strong className="text-slate-800 font-semibold">Instrucciones:</strong> Puedes <strong className="text-[#C64928]">editar cualquier campo</strong> haciendo clic sobre el texto. La edad mostrada se calcula automáticamente al 31 de dic. de 2026.
            </p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-24 font-heading text-4xl animate-pulse text-slate-400">CARGANDO REGISTROS...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-24 text-center">
            <p className="font-heading text-4xl text-slate-400 uppercase italic">No hay solicitudes pendientes</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
              {/* min-w-[1100px] asegura que en celular se pueda hacer scroll horizontal sin apretar los datos */}
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4 w-12 text-center">#</th>
                    <th className="p-4 w-56">Identidad & Edad</th>
                    <th className="p-4 w-64">Corredor</th>
                    <th className="p-4 w-56">Club / Team</th>
                    <th className="p-4 w-48">Categoría</th>
                    <th className="p-4 w-48">Contacto</th>
                    <th className="p-4 text-center w-32">Acción</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {requests.map((req, idx) => {
                    const changes = edits[req.id] || {};
                    const currentClub = (changes.club !== undefined) ? changes.club : (req.club || '');
                    const isManual = manualModeRows[req.id] || (!clubs.includes(currentClub) && currentClub !== "INDEPENDIENTE / LIBRE" && currentClub !== "");
                    
                    const displayRut = changes.rut ?? req.rut;
                    const displayBirth = changes.birth_date ?? req.birth_date;
                    const isDuplicate = existingRiders.some(r => r.rut === displayRut);
                    const racingAge = calculateRacingAge2026(displayBirth);

                    return (
                      <tr key={`${req.id}-${idx}`} className={`group transition-colors ${isDuplicate ? 'bg-orange-50/40 hover:bg-orange-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 text-center font-mono text-slate-400 font-medium text-sm align-top pt-6">{idx + 1}</td>

                        {/* COLUMNA: IDENTIDAD & EDAD */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <div className="relative">
                              <input 
                                type="text"
                                className={`${inputClass} font-mono font-semibold text-sm ${isDuplicate ? 'text-orange-700 bg-orange-100/50' : 'text-slate-700'}`}
                                value={displayRut}
                                onChange={(e) => handleEdit(req.id, 'rut', e.target.value)}
                                placeholder="RUT"
                              />
                            </div>
                            <div className="flex items-center gap-2 px-2">
                              <input 
                                type="date"
                                className="bg-transparent border border-transparent hover:border-slate-300 focus:border-[#C64928] focus:bg-white rounded px-1 py-0.5 outline-none text-xs text-slate-500 font-medium transition-colors w-[110px]"
                                value={displayBirth}
                                onChange={(e) => handleEdit(req.id, 'birth_date', e.target.value)}
                              />
                              {racingAge !== null && (
                                <span className="bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide shadow-sm whitespace-nowrap">
                                  {racingAge} AÑOS
                                </span>
                              )}
                            </div>
                            {isDuplicate && (
                              <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wide px-2 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Duplicado
                              </span>
                            )}
                          </div>
                        </td>

                        {/* COLUMNA: CORREDOR */}
                        <td className="p-4 align-top">
                          <div className="flex flex-col gap-1.5">
                            <input 
                              type="text"
                              className={`${inputClass} font-bold text-slate-800 text-sm uppercase`}
                              value={changes.full_name ?? req.full_name}
                              onChange={(e) => handleEdit(req.id, 'full_name', e.target.value)}
                              placeholder="Nombre Completo"
                            />
                            <input 
                              type="email"
                              className={`${inputClass} text-xs text-slate-500`}
                              value={changes.email ?? req.email}
                              onChange={(e) => handleEdit(req.id, 'email', e.target.value)}
                              placeholder="Correo Electrónico"
                            />
                          </div>
                        </td>

                        {/* COLUMNA: CLUB */}
                        <td className="p-4 align-top pt-5">
                          {isManual ? (
                            <div className="flex items-center gap-1">
                              <input 
                                type="text"
                                className="w-full p-2 bg-white border border-[#C64928] rounded-lg font-semibold text-slate-800 uppercase outline-none text-xs focus:ring-2 focus:ring-orange-100 transition-all shadow-sm"
                                value={currentClub}
                                onChange={(e) => handleEdit(req.id, 'club', e.target.value)}
                                autoFocus
                                placeholder="Nombre del Club"
                              />
                              <button onClick={() => revertToListMode(req.id)} className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg font-bold text-xs transition-colors" title="Cancelar">X</button>
                            </div>
                          ) : (
                            <select 
                              className="w-full p-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C64928] rounded-lg font-semibold text-slate-700 outline-none cursor-pointer uppercase text-xs transition-colors shadow-sm"
                              value={currentClub}
                              onChange={(e) => handleClubChange(req.id, e.target.value)}
                            >
                              <option value="INDEPENDIENTE / LIBRE">INDEPENDIENTE / LIBRE</option>
                              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="__MANUAL_MODE__" className="font-bold text-[#C64928]">📝 INGRESAR OTRO...</option>
                            </select>
                          )}
                        </td>

                        {/* COLUMNA: CATEGORÍA */}
                        <td className="p-4 align-top pt-5">
                          <select 
                            className="w-full p-2 bg-white border border-slate-200 hover:border-slate-300 focus:border-[#C64928] rounded-lg font-semibold text-slate-700 outline-none text-[11px] uppercase transition-colors shadow-sm"
                            value={changes.category ?? req.category}
                            onChange={(e) => handleEdit(req.id, 'category', e.target.value)}
                          >
                             <optgroup label="VARONES">{["Elite Open", "Pre Master", "Master A", "Master B", "Master C", "Master D", "Novicios Open"].map(v => <option key={v} value={v}>{v}</option>)}</optgroup>
                             <optgroup label="DAMAS">{["Novicias Open", "Damas Pre Master", "Damas Master A", "Damas Master B", "Damas Master C"].map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                             <optgroup label="MIXTAS">{["EBike Mixto Open", "Enduro Mixto Open"].map(m => <option key={m} value={m}>{m}</option>)}</optgroup>
                          </select>
                        </td>

                        {/* COLUMNA: CONTACTO */}
                        <td className="p-4 align-top">
                           <div className="flex flex-col gap-1.5">
                              <input 
                                type="text"
                                className={`${inputClass} font-mono font-medium text-xs text-slate-700`}
                                value={changes.phone ?? req.phone}
                                onChange={(e) => handleEdit(req.id, 'phone', e.target.value)}
                                placeholder="Teléfono"
                              />
                              <input 
                                type="text"
                                className={`${inputClass} text-[11px] text-pink-600 font-medium`}
                                value={changes.instagram ?? req.instagram ?? ''} // Aquí está la corrección
                                onChange={(e) => handleEdit(req.id, 'instagram', e.target.value)}
                                placeholder="@instagram (opcional)"
                              />
                           </div>
                        </td>

                        {/* COLUMNA: ACCIONES */}
                        <td className="p-4 text-center align-top pt-5">
                          <div className="flex items-center justify-center gap-2">
                            <button 
                              onClick={() => onApprove(req, isDuplicate)}
                              disabled={!!processing}
                              title="Aprobar e Inscribir"
                              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all shadow-sm ${isDuplicate ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#1A1816] hover:bg-[#C64928]'} text-white font-bold`}
                            >
                               {processing === req.id ? '...' : '✓'}
                            </button>
                            <button 
                              onClick={() => onReject(req)} 
                              disabled={!!processing} 
                              title="Rechazar/Eliminar"
                              className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 flex items-center justify-center transition-all font-bold"
                            >
                               X
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}