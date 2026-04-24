'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createResult, deleteResult } from '@/actions/results';
import { Event, Rider, RawResult } from '@/lib/definitions';
import ExportExcelButton from '@/components/admin/ExportExcelButton'; // ✅ IMPORTAMOS EL BOTÓN AQUÍ

import { normalizeCategory } from '@/lib/utils';
import { OFFICIAL_CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';

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
  eventRiders: any[];
}

export default function ResultManager({ events, riders, existingResults, eventRiders }: Props) {
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('Novicios Varones');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState('');
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
  const [importStep, setImportStep] = useState<'paste' | 'review'>('paste');
  const [previewResults, setPreviewResults] = useState<any[]>([]);

  // 1. SUGERENCIAS (Filtradas por categoría para mantener el orden solicitado)
  const suggestions = useMemo(() => {
    const targetCat = normalize(selectedCategory);
    // Filtramos para que solo aparezcan los de la categoría seleccionada
    const categoryRiders = riders.filter(r => 
        normalize(normalizeCategory(r.category)) === targetCat
    );

    if (!searchTerm.trim()) return categoryRiders.slice(0, 10);
    const term = searchTerm.toLowerCase();
    return categoryRiders.filter(r => 
        r.full_name.toLowerCase().includes(term) || 
        (r.rut && r.rut.toLowerCase().includes(term))
    ).slice(0, 15);
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
      
      // AUTO-SELECCIÓN DE CATEGORÍA
      // Si el rider ya tiene una categoría, la seleccionamos automáticamente en el dropdown
      if (rider.category) {
          setSelectedCategory(rider.category);
      }

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

  const calculatePoints = (pos: number) => {
    if (pos === 1) return 100;
    if (pos <= 10) return 110 - (pos * 10);
    if (pos < 20) return 20 - pos;
    return 1;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      // Importación dinámica para evitar errores de SSR
      const pdfjs = await import('pdfjs-dist');
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(" ");
        fullText += pageText + "\n";
      }

      setImportText(fullText);
      alert("✅ PDF leído con éxito. Ahora verifica los datos detectados.");
    } catch (error) {
      console.error("Error leyendo PDF:", error);
      alert("Hubo un error al leer el PDF. Asegúrate que no esté protegido con contraseña.");
    } finally {
      setLoading(false);
    }
  };

  const generatePreview = () => {
    if (!importText.trim()) return;
    const preview: any[] = [];
    
    // 1. Detectar categorías presentes en el texto
    // Esto lo seguimos haciendo para intentar asignar categoría a los que no encontramos en la DB
    let currentCategoryFromText: string | null = null;
    OFFICIAL_CATEGORIES.forEach(c => {
      if (importText.toUpperCase().includes(c.id.toUpperCase())) {
        currentCategoryFromText = c.id;
      }
    });

    // 2. Escáner Global de Resultados
    // Buscamos: Lugar(D) -> Espacios -> Dorsal(D) -> Espacios -> Nombre(T) -> Espacios -> Tiempo(XX:XX)
    const globalRegex = /(\d+)\s+(\d+)\s+([A-Za-zÁ-ÿ\s\(\)._-]+?)\s+(\d{1,2}:[\d:.]+)/g;
    
    let match;
    while ((match = globalRegex.exec(importText)) !== null) {
      const dorsal = match[2];
      const time = match[4];
      const nameInText = match[3].trim();

      // Buscar al rider en la base de datos de inscritos para este evento
      const entry = eventRiders.find(er => 
        er.event_id === selectedEventId && 
        er.dorsal?.toString() === dorsal.toString()
      );

      preview.push({
        dorsal,
        time,
        rider: entry ? entry.riders?.full_name : nameInText,
        category: currentCategoryFromText || (entry ? entry.category_at_event : null) || selectedCategory,
        found: !!entry,
        rider_id: entry?.rider_id
      });
    }

    if (preview.length === 0) {
      // Fallback extremo si el regex anterior falló por carácteres especiales
      const lines = importText.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const parts = line.split(/\s{2,}/).filter(p => p.trim());
        if (parts.length >= 2) {
           const d = parts[0].match(/\d+/);
           if (d) {
             preview.push({
               dorsal: d[0],
               time: parts[parts.length-1],
               rider: 'Detectado (verificar)',
               category: selectedCategory,
               found: false
             });
           }
        }
      }
    }

    setPreviewResults(preview);
    setImportStep('review');
  };

  const processImport = async () => {
    const validOnes = previewResults.filter(p => p.found);
    if (validOnes.length === 0) return;
    
    setLoading(true);
    try {
      const byCategory: Record<string, any[]> = {};
      validOnes.forEach(r => {
        if (!byCategory[r.category]) byCategory[r.category] = [];
        byCategory[r.category].push(r);
      });

      let processedCount = 0;
      for (const catName in byCategory) {
        const sorted = byCategory[catName].sort((a,b) => a.time.localeCompare(b.time));
        for (let i = 0; i < sorted.length; i++) {
          const item = sorted[i];
          const pos = i + 1;
          await createResult({
            event_id: selectedEventId,
            rider_id: item.rider_id,
            position: pos,
            points: calculatePoints(pos),
            category_played: catName,
            race_time: item.time
          });
          processedCount++;
        }
      }
      alert(`✅ Éxito: ${processedCount} resultados guardados.`);
      setShowImportModal(false);
      setImportText('');
      setImportStep('paste');
    } catch (e) {
      alert("Error al guardar.");
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
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">1. Selecciona el Evento</label>
                    <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); resetFormFull(); }} className="w-full p-3 rounded-lg bg-[#2A221B] text-white border border-white/10 font-bold text-sm">
                        {events.map(ev => <option key={ev.id} value={ev.id} className="text-black bg-white">{ev.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">2. Revisa o Agrega</label>
                    <div className="flex gap-2">
                      <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); resetFormFull(); }} className="flex-1 p-3 rounded-lg bg-[#C64928] text-white font-bold text-sm appearance-none cursor-pointer">
                          {Object.entries(CATEGORY_GROUPS).map(([groupName, categoryList]) => (
                            <optgroup key={groupName} label={groupName.toUpperCase()} className="bg-white text-black">
                              {categoryList.map(c => (
                                <option key={c.id} value={c.id}>{c.label}</option>
                              ))}
                            </optgroup>
                          ))}
                      </select>
                      <button 
                        onClick={() => setShowImportModal(true)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-tighter flex items-center gap-2 shadow-lg transition-transform hover:scale-105 active:scale-95"
                      >
                        ⚡ IMPORTAR RACETIME
                      </button>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* MODAL DE IMPORTACIÓN REDISEÑADO */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/95 z-[999999] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 my-auto">
            
            {/* Cabecera del Modal */}
            <div className="bg-[#1A1816] p-8 text-white relative">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-3xl font-heading uppercase italic tracking-tighter leading-none mb-2">Importar Tiempos</h3>
                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${importStep === 'paste' ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${importStep === 'paste' ? 'border-emerald-400' : 'border-gray-500'}`}>1</span> PEGAR DATOS
                    </div>
                    <div className="w-8 h-px bg-gray-700"></div>
                    <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${importStep === 'review' ? 'text-emerald-400' : 'text-gray-500'}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center border ${importStep === 'review' ? 'border-emerald-400' : 'border-gray-500'}`}>2</span> REVISAR Y GUARDAR
                    </div>
                  </div>
                </div>
                <button onClick={() => { setShowImportModal(false); setImportStep('paste'); }} className="bg-white/10 hover:bg-red-500 w-10 h-10 rounded-full flex items-center justify-center transition-colors">✕</button>
              </div>
            </div>

            <div className="p-8">
              {importStep === 'paste' ? (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-bold text-gray-900 border-b-2 border-slate-100 pb-2 flex items-center gap-2">
                        <span className="bg-slate-900 text-white w-6 h-6 rounded-md flex items-center justify-center text-[10px]">?</span> 
                        ¿Cómo importar?
                      </h4>
                      
                      {/* BOTÓN SUBIR PDF */}
                      <div className="bg-emerald-50 border-2 border-emerald-100 p-6 rounded-[1.5rem] space-y-3 shadow-sm">
                        <p className="text-xs font-bold text-emerald-800">Opción 1: Directo desde el PDF</p>
                        <p className="text-[10px] text-emerald-600 uppercase font-black leading-tight">Sube el archivo de RaceTime y el sistema leerá el texto por ti.</p>
                        <label className="flex items-center justify-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl cursor-pointer transition-all shadow-md group">
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:scale-110 transition-transform"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                          <span className="text-[11px] font-black uppercase tracking-widest">Seleccionar PDF</span>
                          <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} />
                        </label>
                      </div>

                      <div className="bg-slate-50 p-6 rounded-[1.5rem] space-y-3">
                        <p className="text-xs font-bold text-slate-800">Opción 2: Pegar Texto</p>
                        <ul className="space-y-2">
                          {[
                            "Copia el texto del PDF o Excel.",
                            "Pégalo en el cuadro de la derecha.",
                            "El sistema detectará Dorsales y Tiempos."
                          ].map((text, i) => (
                            <li key={i} className="flex gap-2 text-[11px] text-slate-500 font-medium">
                              <span className="text-emerald-500">✔</span> {text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pega aquí los datos:</label>
                      <textarea 
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        placeholder="101  00:45:23&#10;115  00:48:10&#10;..."
                        className="w-full h-64 p-5 font-mono text-sm border-2 border-slate-100 bg-slate-50 rounded-[1.5rem] outline-none focus:border-emerald-500 focus:bg-white transition-all resize-none shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button 
                      onClick={generatePreview}
                      disabled={!importText.trim()}
                      className="bg-[#1A1816] hover:bg-emerald-600 text-white px-10 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-30 flex items-center gap-3"
                    >
                      Verificar Datos <span className="text-xl">→</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                    <p className="text-sm font-bold text-emerald-800">
                      He detectado <span className="bg-emerald-200 px-2 py-0.5 rounded-md">{previewResults.length}</span> entradas. 
                      Los que están en <span className="text-red-600 underline">rojo</span> no se guardarán (Dorsal no encontrado).
                    </p>
                    <button onClick={() => setImportStep('paste')} className="text-xs font-black uppercase text-emerald-600 hover:underline">Volver a editar</button>
                  </div>

                  <div className="max-h-72 overflow-y-auto border-2 border-slate-100 rounded-3xl scrollbar-thin scrollbar-thumb-emerald-500">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 sticky top-0 text-[10px] font-black uppercase text-slate-400 border-b-2 border-slate-100">
                        <tr>
                          <th className="p-4">Dorsal</th>
                          <th className="p-4">Corredor Identificado</th>
                          <th className="p-4">Categoría</th>
                          <th className="p-4">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {previewResults.map((r, i) => (
                          <tr key={i} className={`text-xs font-bold ${r.found ? 'text-slate-800' : 'bg-red-50 text-red-400'}`}>
                            <td className="p-4 font-mono">{r.dorsal}</td>
                            <td className="p-4">{r.rider || '❌ DORSAL DESCONOCIDO'}</td>
                            <td className="p-4"><span className="bg-slate-100 px-2 py-0.5 rounded uppercase">{r.category || 'N/A'}</span></td>
                            <td className="p-4 font-mono">{r.time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={() => setImportStep('paste')} 
                      className="flex-1 py-5 font-black uppercase text-[10px] tracking-widest text-gray-400"
                    >
                      Corregir Lista
                    </button>
                    <button 
                      onClick={processImport}
                      disabled={loading || !previewResults.some(p => p.found)}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl transition-all disabled:opacity-50"
                    >
                      {loading ? 'Sincronizando con el Ranking...' : `Guardar ${previewResults.filter(p => p.found).length} Resultados Ahora`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
                                        <div className="flex flex-col">
                                          <span className="font-black uppercase text-[#1A1816]">{r.full_name}</span>
                                          <span className="text-[9px] font-bold text-[#C64928] uppercase">{normalizeCategory(r.category)}</span>
                                        </div>
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