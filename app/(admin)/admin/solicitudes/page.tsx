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
import ExportExcelButton from '@/components/admin/ExportExcelButton';

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "900"], variable: '--font-montserrat' });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "500", "700"], variable: '--font-mono' });
const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });

const OFFICIAL_CATEGORIES = [
  "Elite Open", "Pre Master (16 a 29 Años)", "Master A (30 a 39 Años)", "Master B (40 a 49 Años)", 
  "Master C (50 a 59 Años)", "Master D (60 Años y Más)", "Novicios Open (55k - Recién empezando)", 
  "Damas Pre Master (15 a 29 Años)", "Damas Master A (30 a 39 Años)", "Damas Master B (40 a 49 Años)", 
  "Damas Master C (50 Años y más)", "Novicias Open (55k - Recién empezando)", 
  "E-Bike Open Mixto (Sin restricciones)", "Enduro Open Mixto (Horquilla 140mm+)"
];

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

const calculateRacingAge2026 = (birthDateStr?: string) => {
  if (!birthDateStr) return null;
  const birthYear = new Date(birthDateStr).getFullYear();
  if (isNaN(birthYear)) return null;
  return 2026 - birthYear;
};

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
      ? `Este rider ya existe en el sistema. ¿Confirmas su pago para esta nueva carrera y actualizas su ficha?`
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
      alert("Error crítico en el servidor.");
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

  const inputClass = "w-full bg-transparent border-2 border-transparent hover:border-slate-200 hover:bg-slate-50 focus:border-[#C64928] focus:bg-white rounded-lg px-3 py-2 outline-none transition-all placeholder:text-slate-400";

  const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
  const nombreArchivo = `Solicitudes_Pendientes_${fechaHoy}`;

  const datosParaExcel = requests?.map(req => {
    const currentData = { ...req, ...edits[req.id] };
    const isDuplicate = existingRiders.some(r => r.rut === currentData.rut);
    const racingAge = calculateRacingAge2026(currentData.birth_date);

    return {
      'RUT': currentData.rut,
      'Corredor': currentData.full_name,
      'Categoría': currentData.category,
      'Club / Team': currentData.club || 'INDEPENDIENTE',
      'Edad de Carrera': racingAge ? `${racingAge} años` : '-',
      'F. Nacimiento': formatDate(currentData.birth_date),
      'Teléfono': currentData.phone || '-',
      'Email': currentData.email || '-',
      'Instagram': currentData.instagram ? `@${currentData.instagram.replace('@', '')}` : '-',
      'Estado': isDuplicate ? 'Rider Frecuente (Ya existe)' : 'Nuevo Registro',
      'Fecha Solicitud': formatDate(currentData.created_at)
    };
  }) || [];

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

          <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
            {requests && requests.length > 0 && (
              <ExportExcelButton data={datosParaExcel} fileName={nombreArchivo} />
            )}

            <div className="flex flex-col items-end bg-white/5 p-4 rounded-2xl border border-white/10">
              <span className="text-[#FFD700] font-heading text-5xl leading-none">{requests.length}</span>
              <span className="text-xs font-semibold uppercase text-slate-300 tracking-wider mt-1">En Espera</span>
            </div>
          </div>
          
        </div>
      </header>

      <div className="max-w-[95rem] mx-auto px-4 -mt-12 relative z-20">
        
        {requests.length > 0 && (
          <div className="space-y-3 mb-6">
            <div className="flex flex-col md:flex-row items-start md:items-center bg-[#EFE6D5] border-l-8 border-[#C64928] p-5 rounded-xl shadow-md text-sm text-[#1A1816] font-medium">
              <p>
                <strong className="text-[#1A1816] font-black uppercase tracking-wide">💡 Edición Rápida:</strong> Puedes editar los campos directamente en la tabla. La edad se calcula al 31-12-2026.
              </p>
            </div>

            {/* ✅ BANNER EXPLICATIVO PARA RIDERS FRECUENTES */}
            {requests.some(req => existingRiders.some(r => r.rut === (edits[req.id]?.rut ?? req.rut))) && (
              <div className="flex flex-col md:flex-row items-start md:items-center bg-blue-50 border-l-8 border-blue-500 p-5 rounded-xl shadow-md text-sm text-blue-900 font-medium">
                <p>
                  <strong className="text-blue-700 font-black uppercase tracking-wide">ℹ️ Riders Frecuentes:</strong> Los marcados en azul ya están en el sistema. <strong>Solo verifica su nuevo pago</strong> y dales "Aprobar" para inscribirlos en esta fecha.
                </p>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="text-center py-24 font-heading text-4xl animate-pulse text-slate-400">CARGANDO SOLICITUDES...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 p-24 text-center">
            <p className="font-heading text-4xl text-slate-400 uppercase italic">Tu bandeja está limpia</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2rem] shadow-2xl border-2 border-slate-200 overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#C64928] scrollbar-track-slate-100">
              
              <table className="w-full text-left border-collapse min-w-[1350px]">
                <thead className="bg-[#1A1816] border-b-4 border-[#C64928] text-[10px] uppercase font-black tracking-widest text-[#EFE6D5]">
                  <tr>
                    <th className="p-5 w-16 text-center">#</th>
                    <th className="p-5 min-w-[200px]">IDENTIDAD & EDAD</th>
                    <th className="p-5 min-w-[300px]">CORREDOR</th>
                    <th className="p-5 min-w-[280px]">CLUB / TEAM</th>
                    <th className="p-5 min-w-[200px]">CATEGORÍA</th>
                    <th className="p-5 min-w-[200px]">CONTACTO</th>
                    <th className="p-5 text-center w-36">ACCIÓN</th>
                  </tr>
                </thead>

                <tbody className="divide-y-2 divide-slate-100">
                  {requests.map((req, idx) => {
                    const changes = edits[req.id] || {};
                    const currentClub = (changes.club !== undefined) ? changes.club : (req.club || '');
                    const isManual = manualModeRows[req.id] || (!clubs.includes(currentClub) && currentClub !== "INDEPENDIENTE / LIBRE" && currentClub !== "");
                    
                    const displayRut = changes.rut ?? req.rut;
                    const displayBirth = changes.birth_date ?? req.birth_date;
                    const isDuplicate = existingRiders.some(r => r.rut === displayRut);
                    const racingAge = calculateRacingAge2026(displayBirth);

                    return (
                      <tr key={`${req.id}-${idx}`} className={`group transition-all ${isDuplicate ? 'bg-blue-50/60 hover:bg-blue-100/60' : 'bg-white hover:bg-slate-50'}`}>
                        <td className="p-5 text-center font-mono text-slate-400 font-bold text-sm align-top pt-8">{idx + 1}</td>

                        <td className="p-5 align-top">
                          <div className="flex flex-col gap-2">
                            <div className="relative">
                              <input 
                                type="text"
                                className={`${inputClass} font-mono font-bold text-sm ${isDuplicate ? 'text-blue-700 bg-blue-100/50 border-blue-200' : 'text-[#1A1816]'}`}
                                value={displayRut}
                                onChange={(e) => handleEdit(req.id, 'rut', e.target.value)}
                                placeholder="RUT"
                              />
                            </div>
                            <div className="flex items-center gap-3 px-2">
                              <input 
                                type="date"
                                className="bg-transparent border-2 border-transparent hover:border-slate-200 focus:border-[#C64928] focus:bg-white rounded-lg px-2 py-1 outline-none text-xs text-slate-600 font-bold transition-all w-[125px]"
                                value={displayBirth}
                                onChange={(e) => handleEdit(req.id, 'birth_date', e.target.value)}
                              />
                              {racingAge !== null && (
                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-widest shadow-sm whitespace-nowrap ${isDuplicate ? 'bg-blue-600 text-white' : 'bg-[#1A1816] text-[#EFE6D5]'}`}>
                                  {racingAge} AÑOS
                                </span>
                              )}
                            </div>
                            {isDuplicate && (
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-2 flex items-center gap-1.5 mt-1 bg-blue-100 w-fit py-0.5 rounded-md">
                                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Rider Frecuente
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="p-5 align-top">
                          <div className="flex flex-col gap-2">
                            <input 
                              type="text"
                              className={`${inputClass} font-black text-[#1A1816] text-sm uppercase`}
                              value={changes.full_name ?? req.full_name}
                              onChange={(e) => handleEdit(req.id, 'full_name', e.target.value)}
                              placeholder="Nombre Completo"
                            />
                            <input 
                              type="email"
                              className={`${inputClass} text-xs text-slate-500 font-medium lowercase`}
                              value={changes.email ?? req.email}
                              onChange={(e) => handleEdit(req.id, 'email', e.target.value)}
                              placeholder="Correo Electrónico"
                            />
                          </div>
                        </td>

                        <td className="p-5 align-top pt-6">
                          {isManual ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                className="w-full p-3 bg-white border-2 border-[#C64928] rounded-xl font-black text-[#C64928] uppercase outline-none text-xs transition-all shadow-sm"
                                value={currentClub}
                                onChange={(e) => handleEdit(req.id, 'club', e.target.value)}
                                placeholder="Escribe el Club..."
                              />
                              <button onClick={() => revertToListMode(req.id)} className="p-3 bg-slate-200 hover:bg-[#1A1816] hover:text-white text-slate-600 rounded-xl font-black text-xs transition-colors" title="Cancelar Entrada Manual">X</button>
                            </div>
                          ) : (
                            <select 
                              className="w-full p-3 bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-[#C64928] rounded-xl font-black text-[#1A1816] outline-none cursor-pointer uppercase text-xs transition-colors shadow-sm"
                              value={currentClub}
                              onChange={(e) => handleClubChange(req.id, e.target.value)}
                            >
                              <option value="INDEPENDIENTE / LIBRE">INDEPENDIENTE / LIBRE</option>
                              {clubs.map(c => <option key={c} value={c}>{c}</option>)}
                              <option value="__MANUAL_MODE__" className="font-black text-[#C64928]">➕ INGRESAR NUEVO CLUB...</option>
                            </select>
                          )}
                        </td>

                        <td className="p-5 align-top pt-6">
                          <select 
                            className="w-full p-3 bg-slate-50 border-2 border-slate-200 hover:border-slate-300 focus:border-[#C64928] rounded-xl font-bold text-[#1A1816] outline-none text-[11px] uppercase transition-colors shadow-sm"
                            value={changes.category ?? req.category}
                            onChange={(e) => handleEdit(req.id, 'category', e.target.value)}
                          >
                            <option value={req.category} className="hidden">{req.category}</option>
                            {OFFICIAL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>

                        <td className="p-5 align-top">
                           <div className="flex flex-col gap-2">
                              <input 
                                type="text"
                                className={`${inputClass} font-mono font-bold text-xs text-slate-600`}
                                value={changes.phone ?? req.phone}
                                onChange={(e) => handleEdit(req.id, 'phone', e.target.value)}
                                placeholder="Teléfono"
                              />
                              <input 
                                type="text"
                                className={`${inputClass} text-xs text-pink-600 font-bold`}
                                value={changes.instagram ?? req.instagram ?? ''}
                                onChange={(e) => handleEdit(req.id, 'instagram', e.target.value)}
                                placeholder="@instagram (opcional)"
                              />
                           </div>
                        </td>

                        <td className="p-5 text-center align-top pt-6">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => onApprove(req, isDuplicate)}
                              disabled={!!processing}
                              title="Aprobar e Inscribir"
                              className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all shadow-md hover:shadow-lg ${isDuplicate ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#1A1816] hover:bg-[#C64928] hover:scale-105'} text-[#EFE6D5] font-black text-lg`}
                            >
                               {processing === req.id ? '...' : '✓'}
                            </button>
                            <button 
                              onClick={() => onReject(req)} 
                              disabled={!!processing} 
                              title="Rechazar/Eliminar"
                              className="w-11 h-11 rounded-xl bg-white border-2 border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-500 hover:bg-red-50 flex items-center justify-center transition-all font-black text-lg"
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