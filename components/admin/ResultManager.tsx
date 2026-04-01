'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createResult, deleteResult } from '@/actions/results';
import { Event, Rider, RawResult } from '@/lib/definitions';
import ExportExcelButton from '@/components/admin/ExportExcelButton'; // ✅ IMPORTAMOS EL BOTÓN AQUÍ

// --- UTILITIES ---
const formatRut = (rut: string | null | undefined) => {
  if (!rut) return '';
  const clean = rut.replace(/[^0-9kK]/g, '');
  if (clean.length < 2) return clean;
  const body = clean.slice(0, -1);
  const dv = clean.slice(-1).toUpperCase();
  return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, ".")}-${dv}`;
};

const normalize = (str: string | null | undefined) => {
    if (!str) return '';
    return str.trim().toUpperCase();
};

interface Props {
  events: Event[];
  riders: Rider[]; 
  existingResults: RawResult[];
}

export default function ResultManager({ events, riders, existingResults }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('Novicios Open');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterTable, setFilterTable] = useState<string>('');
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  const [position, setPosition] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  const [raceTime, setRaceTime] = useState<string>('');
  const [avgSpeed, setAvgSpeed] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // 1. SUGERENCIAS
  const suggestions = useMemo(() => {
    const targetCat = normalize(selectedCategory);
    const categoryRiders = riders.filter(r => normalize(r.category) === targetCat);
    if (!searchTerm.trim()) return categoryRiders;
    const term = searchTerm.toLowerCase();
    return categoryRiders.filter(r => 
        r.full_name.toLowerCase().includes(term) || 
        (r.rut && r.rut.toLowerCase().includes(term))
    );
  }, [riders, searchTerm, selectedCategory]);

  // 2. RESULTADOS ACTUALES (FILTRADOS POR CATEGORÍA Y EVENTO)
  const currentViewResults = useMemo(() => {
    const targetCat = normalize(selectedCategory);
    let filtered = existingResults.filter(r => 
        r.event_id === selectedEventId && 
        normalize(r.category_played) === targetCat
    );
    if (filterTable.trim()) {
        const term = filterTable.toLowerCase();
        filtered = filtered.filter(res => {
            const rData = riders.find(r => r.id === res.rider_id);
            return rData?.full_name.toLowerCase().includes(term) || rData?.rut?.includes(term);
        });
    }
    return filtered.sort((a, b) => a.position - b.position);
  }, [existingResults, selectedEventId, selectedCategory, filterTable, riders]);

  // ✅ PREPARAR DATOS PARA EL EXCEL BASADOS EN LA VISTA ACTUAL
  const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
  const nombreArchivoExcel = `Resultados_${selectedCategory.replace(/ /g, '_')}_${fechaHoy}`;
  
  const datosParaExcel = currentViewResults.map(res => {
    const rider = riders.find(r => r.id === res.rider_id);
    return {
      'Posición': res.position,
      'Corredor': rider?.full_name || 'Desconocido',
      'RUT': rider?.rut ? formatRut(rider.rut) : '-',
      'Club / Team': rider?.club || 'Independiente',
      'Categoría': res.category_played,
      'Tiempo Carrera': res.race_time || '-',
      'Promedio Km/h': res.avg_speed ? `${res.avg_speed} km/h` : '-',
      'Puntos': res.points
    };
  });

  // 3. AUTO-EDICIÓN
  useEffect(() => {
    if (!selectedRiderId || !selectedEventId) {
        setIsEditing(false);
        resetDataFields();
        return;
    }
    const targetCat = normalize(selectedCategory);
    const existing = existingResults.find(r => 
        r.event_id === selectedEventId && 
        r.rider_id === selectedRiderId &&
        normalize(r.category_played) === targetCat
    );
    
    if (existing) {
        setIsEditing(true);
        setPosition(existing.position.toString());
        setPoints(existing.points.toString());
        setRaceTime(existing.race_time || '');
        setAvgSpeed(existing.avg_speed?.toString() || '');
    } else {
        setIsEditing(false);
        resetDataFields();
    }
  }, [selectedRiderId, selectedEventId, selectedCategory, existingResults]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetDataFields = () => { setPosition(''); setPoints(''); setRaceTime(''); setAvgSpeed(''); };
  const resetFormFull = () => { setIsEditing(false); resetDataFields(); setSelectedRiderId(''); setSearchTerm(''); setShowDropdown(false); };
  
  const handleSelectRider = (rider: Rider) => { 
      setSelectedRiderId(rider.id); 
      setSearchTerm(rider.full_name); 
      setShowDropdown(false); 
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPosition(val);
      const pos = parseInt(val);
      if (!isNaN(pos) && pos > 0) {
          let calcPoints = 0;
          if (pos === 1) calcPoints = 100;
          else if (pos <= 10) calcPoints = 110 - (pos * 10);
          else if (pos < 20) calcPoints = 20 - pos;
          else calcPoints = 1;
          setPoints(calcPoints.toString());
      } else setPoints('');
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 6) return; 
    let formatted = raw;
    if (raw.length > 2) formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`;
    if (raw.length > 4) formatted = `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4)}`;
    setRaceTime(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedRiderId || !position || !points) {
        alert("Faltan datos obligatorios (Corredor, Posición o Puntos)");
        return;
    }
    setLoading(true);
    try {
      const finalPosition = parseInt(position, 10);
      const finalPoints = parseInt(points, 10);
      const finalAvgSpeed = avgSpeed ? parseFloat(avgSpeed) : null;
      const finalRaceTime = raceTime.trim() !== '' ? raceTime : null;

      await createResult({
        event_id: selectedEventId, 
        rider_id: selectedRiderId, 
        position: finalPosition,
        points: finalPoints, 
        category_played: selectedCategory, 
        race_time: finalRaceTime, 
        avg_speed: finalAvgSpeed
      });
      
      resetFormFull(); 
    } catch (error) { 
        console.error("Error completo:", error); 
        alert("Ocurrió un error al guardar el resultado."); 
    } finally { 
        setLoading(false); 
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('¿Borrar este resultado?')) return;
    setLoading(true);
    try {
        await deleteResult(resultId);
        if (isEditing) resetFormFull();
    } catch (error) {
        alert("Error al borrar el resultado.");
    } finally {
        setLoading(false);
    }
  };

  const inputClass = "w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-300 outline-none focus:border-[#C64928] font-semibold text-sm";
  const labelClass = "block text-[11px] font-bold uppercase text-gray-500 mb-1 ml-1";

  return (
    <div className="p-2 sm:p-4 space-y-6">
      
      {/* 1. CONFIGURACIÓN */}
      <div className="bg-[#1A1816] p-6 rounded-2xl shadow-lg border-b-4 border-[#C64928]">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
                <label className="text-gray-400 text-[10px] font-bold uppercase">Evento Activo</label>
                <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); resetFormFull(); }} className="w-full p-3 rounded-lg bg-[#2A221B] text-white border border-white/10 font-bold text-sm">
                    {events.map(ev => <option key={ev.id} value={ev.id} className="text-black bg-white">{ev.name}</option>)}
                </select>
            </div>
            <div className="space-y-1">
                <label className="text-gray-400 text-[10px] font-bold uppercase">Manga / Categoría</label>
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); resetFormFull(); }} className="w-full p-3 rounded-lg bg-[#C64928] text-white font-bold text-sm appearance-none cursor-pointer">
                    <optgroup label="VARONES" className="bg-white text-black">
                        {["Elite Open", "Pre Master", "Master A", "Master B", "Master C", "Master D", "Novicios Open"].map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="DAMAS" className="bg-white text-black">
                        {["Damas Pre Master", "Damas Master A", "Damas Master B", "Damas Master C", "Novicias Open"].map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                    <optgroup label="MIXTAS" className="bg-white text-black">
                        {["Enduro Mixto Open", "EBike Mixto Open"].map(c => <option key={c} value={c}>{c}</option>)}
                    </optgroup>
                </select>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 2. FORMULARIO */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'} shadow-sm h-fit`}>
            <h2 className="text-xs font-black text-gray-900 uppercase mb-6 italic">Ingreso de Tiempos</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative" ref={searchContainerRef}>
                    <label className={labelClass}>Corredor</label>
                    <input type="text" value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); setSelectedRiderId(''); }} placeholder="Nombre o RUT..." className={inputClass} />
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-lg shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[999]">
                            {suggestions.length > 0 ? (
                                suggestions.map(r => (
                                    <div key={r.id} onClick={() => handleSelectRider(r)} className="p-3 border-b border-gray-50 hover:bg-orange-50 cursor-pointer flex justify-between items-center text-xs">
                                        <span className="font-bold uppercase">{r.full_name}</span>
                                        <span className="text-[10px] font-mono text-gray-400">{formatRut(r.rut)}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="p-3 text-center text-xs text-gray-500 italic">No hay corredores en esta categoría.</div>
                            )}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className={labelClass}>Posición</label>
                        <input type="number" value={position} onChange={handlePositionChange} className={`${inputClass} text-center`} placeholder="0" required />
                    </div>
                    <div>
                        <label className={labelClass}>Puntos (Editable)</label>
                        <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className={`${inputClass} text-center font-bold text-[#C64928]`} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Tiempo Carrera</label><input type="text" value={raceTime} onChange={handleTimeChange} className={`${inputClass} text-center font-mono`} placeholder="00:00:00" /></div>
                    <div><label className={labelClass}>Promedio Km/h</label><input type="number" step="0.1" value={avgSpeed} onChange={(e) => setAvgSpeed(e.target.value)} className={`${inputClass} text-center`} placeholder="0.0" /></div>
                </div>
                <button disabled={loading || !selectedRiderId} className={`w-full py-4 rounded-xl text-white font-bold uppercase text-xs tracking-widest transition-all ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1A1816] hover:bg-[#C64928] disabled:opacity-30'}`}>
                    {loading ? 'Procesando...' : isEditing ? 'Actualizar Registro' : 'Guardar Resultado'}
                </button>
            </form>
        </div>

        {/* 3. LISTADO CON FILTRO Y BOTÓN EXCEL */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-xs font-black text-gray-900 uppercase">Ranking Provisional</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Categoría: {selectedCategory}</span>
                    </div>
                    
                    {/* ✅ EL BOTÓN EXCEL AHORA VIVE AQUÍ Y DESCARGA SOLO LA CATEGORÍA VISIBLE */}
                    {currentViewResults.length > 0 && (
                        <div className="scale-75 origin-right">
                           <ExportExcelButton data={datosParaExcel} fileName={nombreArchivoExcel} />
                        </div>
                    )}
                </div>

                <input type="text" value={filterTable} onChange={(e) => setFilterTable(e.target.value)} placeholder="Filtrar tabla por nombre o RUT..." className="w-full p-2 text-xs border rounded-md bg-white outline-none focus:border-[#C64928]" />
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[450px]">
                    <tbody className="divide-y divide-gray-50">
                        {currentViewResults.length > 0 ? (
                            currentViewResults.map((res) => {
                                const rider = riders.find(r => r.id === res.rider_id);
                                return (
                                    <tr key={res.id} onClick={() => { setSelectedRiderId(res.rider_id); setSearchTerm(rider?.full_name || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                                        <td className="p-4 text-center font-bold text-xl text-gray-900 italic w-16">{res.position}º</td>
                                        <td className="p-4">
                                            <div className="text-xs font-black text-gray-900 uppercase">{rider?.full_name || 'Corredor Desconocido'}</div>
                                            <div className="text-[9px] text-[#C64928] font-bold uppercase">{rider?.club || 'Independiente'}</div>
                                        </td>
                                        <td className="p-4 text-center font-mono text-xs text-gray-500">{res.race_time || '--:--:--'}</td>
                                        <td className="p-4 text-right font-bold text-gray-900">{res.points} <span className="text-[8px] text-gray-400 ml-0.5">PTS</span></td>
                                        <td className="p-4 text-right w-12">
                                            <button onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }} disabled={loading} className="p-1 text-gray-200 hover:text-red-500 disabled:opacity-50"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-xs text-gray-400 italic">No hay resultados guardados en esta manga.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}