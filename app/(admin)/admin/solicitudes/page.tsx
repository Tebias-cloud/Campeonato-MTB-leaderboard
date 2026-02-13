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

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "700", "900"], variable: '--font-montserrat' });
const mono = Roboto_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: '--font-mono' });
const teko = Teko({ subsets: ["latin"], weight: ["400", "600", "700"], variable: '--font-teko' });

interface EditFields {
  club?: string;
  category?: string;
  rut?: string;
  phone?: string;
  instagram?: string;
}

interface ExistingRider {
  rut: string;
  email: string;
}

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
      console.error("Error cargando datos:", error);
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
    // Manejo de errores visual y por confirmación
    const confirmMessage = isDuplicate 
      ? `⚠️ ATENCIÓN: El rider con RUT ${req.rut} ya existe en la base de datos.\n\n¿Deseas sincronizar y ACTUALIZAR sus datos con esta nueva solicitud?`
      : `¿Aprobar inscripción de ${req.full_name}?`;

    if (!confirm(confirmMessage)) return;
    
    setProcessing(req.id);
    try {
      const res = await approveRequest(req.id, edits[req.id]);
      
      if (res.success) {
        // Limpiamos los estados locales para este ID
        setRequests(prev => prev.filter(r => r.id !== req.id));
        const newEdits = { ...edits };
        delete newEdits[req.id];
        setEdits(newEdits);
      } else {
        // Si el servidor devuelve error (ej. el 23505 capturado en el action)
        alert(`❌ Error al procesar: ${res.message}`);
      }
    } catch (err) {
      alert("❌ Ocurrió un error crítico en el servidor.");
    } finally {
      setProcessing(null);
      // Recargamos datos de riders existentes por si hubo cambios
      const { data } = await supabase.from('riders').select('rut, email');
      if (data) setExistingRiders(data as ExistingRider[]);
    }
  };

  const onReject = async (req: RegistrationRequest) => {
    if (!confirm(`¿ELIMINAR SOLICITUD?\n\nSe borrarán permanentemente los datos de: ${req.full_name}`)) return;
    setProcessing(req.id);
    const res = await rejectRequest(req.id);
    if (res.success) {
      setRequests(prev => prev.filter(r => r.id !== req.id));
    } else {
      alert(res.message);
    }
    setProcessing(null);
  };

  return (
    <main className={`min-h-screen bg-[#EFE6D5] text-[#1A1816] ${montserrat.variable} ${teko.variable} ${mono.variable} font-sans pb-32`}>
      
      <header className="bg-[#1A1816] pt-12 pb-24 px-6 rounded-b-[50px] shadow-2xl relative border-b-[8px] border-[#C64928]">
        <div className="max-w-[95rem] mx-auto relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
          <div>
            <Link href="/admin" className="text-[#FFD700] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block hover:underline transition-all">
              ← VOLVER AL PANEL
            </Link>
            <h1 className="font-heading text-6xl md:text-7xl text-white uppercase italic leading-none tracking-tighter">
              SOLICITUDES <span className="text-[#C64928]">ENTRANTES</span>
            </h1>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[#FFD700] font-heading text-6xl leading-none">{requests.length}</span>
            <span className="text-[10px] font-black uppercase text-white tracking-[0.2em]">En Espera</span>
          </div>
        </div>
      </header>

      <div className="max-w-[95rem] mx-auto px-4 -mt-12 relative z-20">
        {loading ? (
          <div className="text-center py-24 font-heading text-4xl animate-pulse text-[#1A1816]">OBTENIENDO DATOS...</div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] shadow-2xl border-2 border-dashed border-slate-200 p-24 text-center">
            <p className="font-heading text-5xl text-slate-300 uppercase italic">Bandeja Vacía</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead className="bg-slate-50 border-b-2 border-slate-100 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                  <tr>
                    <th className="p-6 w-16 text-center">#</th>
                    <th className="p-6 w-36">RUT / ID</th>
                    <th className="p-6 w-72">CORREDOR</th>
                    <th className="p-6 w-96">CLUB / TEAM</th>
                    <th className="p-6 w-56">CATEGORÍA</th>
                    <th className="p-6 w-56">CONTACTO</th>
                    <th className="p-6 text-center w-36">GESTIÓN</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-50">
                  {requests.map((req, idx) => {
                    const changes = edits[req.id] || {};
                    const currentClub = (changes.club !== undefined) ? changes.club : (req.club || '');
                    const isManual = manualModeRows[req.id] || (!clubs.includes(currentClub) && currentClub !== "INDEPENDIENTE / LIBRE" && currentClub !== "");
                    const isDuplicate = existingRiders.some(r => r.rut === req.rut);

                    return (
                      <tr key={req.id} className={`group transition-all ${isDuplicate ? 'bg-orange-50/50 hover:bg-orange-50' : 'hover:bg-slate-50'}`}>
                        <td className="p-5 text-center font-mono text-slate-300 font-black text-xs border-r border-slate-50">{idx + 1}</td>

                        <td className="p-5 border-r border-slate-50">
                          <div className={`font-mono font-bold text-sm px-2 py-1 rounded shadow-inner inline-block ${isDuplicate ? 'bg-orange-600 text-white' : 'bg-[#1A1816] text-[#C64928]'}`}>
                            {req.rut}
                          </div>
                          {isDuplicate && (
                            <div className="text-[9px] font-black text-orange-600 mt-2 uppercase tracking-tighter animate-pulse">
                              ⚠️ Ya existe en base
                            </div>
                          )}
                        </td>

                        <td className="p-5 border-r border-slate-50">
                          <div className="font-black text-[#1A1816] text-base uppercase leading-none tracking-tighter mb-1">{req.full_name}</div>
                          <div className="text-[10px] text-slate-400 font-bold lowercase mb-2">{req.email}</div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border-2 ${req.terms_accepted ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400 border-slate-200'}`}>
                            {req.terms_accepted ? 'Legal OK' : 'No Firmó'}
                          </span>
                        </td>

                        <td className="p-4 border-r border-slate-50 bg-white group-hover:bg-transparent">
                          {isManual ? (
                            <div className="flex items-center gap-2">
                              <input 
                                type="text"
                                className="w-full p-3 bg-orange-50 border-2 border-[#C64928] rounded-xl font-black text-[#1A1816] uppercase outline-none text-xs"
                                value={currentClub}
                                onChange={(e) => handleEdit(req.id, 'club', e.target.value)}
                                autoFocus
                              />
                              <button onClick={() => revertToListMode(req.id)} className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-black">↩</button>
                            </div>
                          ) : (
                            <div className="relative group/sel">
                              <select 
                                className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-[#C64928] rounded-xl font-black text-[#1A1816] outline-none cursor-pointer uppercase text-xs appearance-none"
                                value={currentClub}
                                onChange={(e) => handleClubChange(req.id, e.target.value)}
                              >
                                <option value="INDEPENDIENTE / LIBRE">⭐ INDEPENDIENTE / LIBRE</option>
                                {clubs.map(c => <option key={c} value={c}>{c}</option>)}
                                <option value="__MANUAL_MODE__" className="bg-[#C64928] text-white font-black">✍️ NUEVO CLUB...</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#C64928] font-black text-[10px]">▼</div>
                            </div>
                          )}
                        </td>

                        <td className="p-4 border-r border-slate-50">
                          <select 
                            className="w-full p-3 bg-slate-50 border-2 border-transparent focus:border-[#C64928] rounded-xl font-black text-slate-600 outline-none text-[10px] uppercase appearance-none"
                            value={changes.category ?? req.category}
                            onChange={(e) => handleEdit(req.id, 'category', e.target.value)}
                          >
                             <optgroup label="VARONES">{["Elite Open", "Pre Master", "Master A", "Master B", "Master C", "Master D", "Novicios Open"].map(v => <option key={v} value={v}>{v}</option>)}</optgroup>
                             <optgroup label="DAMAS">{["Novicias Open", "Damas Pre Master", "Damas Master A", "Damas Master B", "Damas Master C"].map(d => <option key={d} value={d}>{d}</option>)}</optgroup>
                          </select>
                        </td>

                        <td className="p-5 border-r border-slate-50 font-black">
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-mono text-[#1A1816]">📞 {changes.phone ?? req.phone}</span>
                              {req.instagram && <span className="text-[10px] text-pink-600 italic tracking-tight">ig: @{req.instagram.replace('@','')}</span>}
                           </div>
                        </td>

                        <td className="p-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              onClick={() => onApprove(req, isDuplicate)}
                              disabled={!!processing}
                              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-lg border-b-4 border-black/20 active:border-b-0 ${isDuplicate ? 'bg-orange-500 hover:bg-orange-600' : 'bg-[#1A1816] hover:bg-[#C64928]'} text-white`}
                            >
                               {processing === req.id ? '⏳' : '✓'}
                            </button>
                            <button onClick={() => onReject(req)} disabled={!!processing} className="w-12 h-12 rounded-2xl bg-white border-2 border-slate-200 text-slate-300 hover:text-red-500 flex items-center justify-center transition-all">
                               ✕
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

      <div className="mt-12 text-center opacity-30">
        <p className="text-[9px] font-black uppercase tracking-[0.4em]">Dashboard de Validación Chaski Riders v2.2</p>
      </div>
    </main>
  );
}