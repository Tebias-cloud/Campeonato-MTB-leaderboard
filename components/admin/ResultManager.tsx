'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { createResult, deleteResult } from '@/actions/results';
import { assignSingleDorsal } from '@/actions/dorsals'; 
import { Event, Rider, RawResult } from '@/lib/definitions';
import ExportExcelButton from '@/components/admin/ExportExcelButton'; 

import { normalizeCategory } from '@/lib/utils';
import { OFFICIAL_CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';

// Regex ultra-precisa fuera del componente para evitar errores de compilación
// [Puesto?] [Dorsal] [Nombre] [Tiempo]
const RIDER_REGEX = new RegExp("(?:(\\d+)\\s+)?(\\d+)\\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ\\s()\\.#&\\'\\/-]{3,})\\s+(\\d{1,2}:[\\d:.]+|DQ)", "gi");

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
    return str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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
  const [isDragging, setIsDragging] = useState(false);

  // 1. SUGERENCIAS
  const suggestions = useMemo(() => {
    const targetCat = normalize(selectedCategory);
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

  // 2. RESULTADOS ACTUALES
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

  const fechaHoy = new Date().toLocaleDateString('es-CL').replace(/\//g, '-');
  const currentEventName = events.find(e => e.id === selectedEventId)?.name || 'Evento';
  const nombreArchivoExcel = `Resultados_${(selectedCategory || 'Cat').replace(/ /g, '_')}_${fechaHoy}`;
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
      if (rider.category) setSelectedCategory(rider.category);
      setShowDropdown(false); 
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value.toUpperCase();
      setPosition(val);
      
      if (val === 'DQ') {
          setPoints('0');
          return;
      }

      const pos = parseInt(val);
      if (!isNaN(pos) && pos > 0) {
          setPoints(calculatePoints(pos).toString());
      } else setPoints('');
  };

  const calculatePoints = (pos: number, isDQ: boolean = false) => {
    if (isDQ || pos === 999) return 0;
    if (pos === 1) return 100;
    if (pos <= 10) return 110 - (pos * 10);
    if (pos < 20) return 20 - pos;
    return 1;
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (val === 'DQ') {
        setRaceTime('DQ');
        return;
    }
    const raw = val.replace(/\D/g, '');
    if (raw.length > 6) return; 
    let formatted = raw;
    if (raw.length > 2) formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`;
    if (raw.length > 4) formatted = `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4)}`;
    setRaceTime(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId || !selectedRiderId || !position || !points) {
        alert("Faltan datos obligatorios");
        return;
    }
    setLoading(true);
    try {
      const finalPos = position.toUpperCase() === 'DQ' ? 999 : parseInt(position, 10);
      await createResult({
        event_id: selectedEventId, 
        rider_id: selectedRiderId, 
        position: finalPos,
        points: parseInt(points, 10), 
        category_played: selectedCategory, 
        race_time: raceTime.trim() !== '' ? raceTime : null, 
        avg_speed: avgSpeed ? parseFloat(avgSpeed) : null
      });
      resetFormFull(); 
    } catch (error) { alert("Error al guardar."); } finally { setLoading(false); }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('¿Borrar este resultado?')) return;
    setLoading(true);
    try {
        await deleteResult(resultId);
        if (isEditing) resetFormFull();
    } catch (error) { alert("Error al borrar."); } finally { setLoading(false); }
  };

  // --- LÓGICA DE PDF MEJORADA (MÁS INTUITIVA) ---
  const processPdfFile = async (file: File) => {
    setLoading(true);
    try {
      await new Promise<void>((resolve, reject) => {
        if ((window as any).pdfjsLib) return resolve();
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("No se pudo cargar el motor PDF."));
        document.body.appendChild(script);
      });

      const pdfjsLib = (window as any)['pdfjsLib'];
      pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        fullText += textContent.items.map((item: any) => item.str).join(" ") + "\n";
      }
      setImportText(fullText);
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setLoading(false); }
  }  
  
  const detectedResults = useMemo(() => {
    if (!importText || !importText.trim()) return [];
    
    const results: any[] = [];
    const lines = importText.split(/\r?\n/);
    let currentCategory = "DESCONOCIDA";

    // Usamos la regex definida fuera del componente

    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.length < 2) return;

      // 1. ¿ES UNA CATEGORÍA?
      const upper = cleanLine.toUpperCase();
      const catKeywords = ["MASTER", "ELITE", "NOVICIO", "DAMAS", "VARONES", "MIXTO", "PRO", "INFANTIL", "JUVENIL", "CADETE", "SUB", "EBIKE", "ENDURO"];
      const isNoise = upper.includes("PUESTO") || upper.includes("DORSAL") || upper.includes("PAGINA") || upper.includes("RESULTADOS") || upper.includes("OFICIAL") || upper.includes("TIEMPO");
      
      if (catKeywords.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/)) {
        let detected = upper.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|RESULTADOS|FECHA)\s*[:\-]?\s*/i, "").trim();
        // Unificación de Pre Master según reglamento:
        if (detected.includes("PRE MASTER") || detected.includes("PREMASTER")) {
          detected = "PRE MASTER MIXTO";
        }
        currentCategory = detected;
        return;
      }

      // 2. BUSCAR CORREDORES
      const riderMatches = Array.from(cleanLine.matchAll(RIDER_REGEX));
      riderMatches.forEach(match => {
        const puesto = match[1];
        const dorsal = match[2];
        const rawName = match[3].trim().toUpperCase();
        const time = match[4].toUpperCase();

        if (dorsal.length === 4 && dorsal.startsWith("20")) return;
        if (rawName.includes("PUESTO") || rawName.includes("DORSAL")) return;

        const isDQ = time === 'DQ';
        const nameInText = rawName.split('(')[0].trim();

        // Identificación por Dorsal en este Evento
        const entryByDorsal = eventRiders.find(er => 
          er.event_id === selectedEventId && 
          er.dorsal?.toString() === dorsal.toString()
        );
        
        const riderByName = !entryByDorsal ? riders.find(r => normalize(r.full_name) === normalize(nameInText)) : null;
        const identifiedRiderId = entryByDorsal?.rider_id || riderByName?.id || null;
        const identifiedName = entryByDorsal?.riders?.full_name || riderByName?.full_name || null;
        const riderProfile = riders.find(r => r.id === identifiedRiderId);
        
        // TRIPLE SEGURIDAD EN CATEGORÍA:
        // 1. Categoría de Inscripción (Evento)
        // 2. Categoría de Perfil (Ficha del Corredor)
        // 3. Categoría del PDF (Título actual)
        let finalCategory = entryByDorsal?.category_at_event || 
                            riderProfile?.category || 
                            currentCategory || 
                            "DESCONOCIDA";

        // NORMALIZACIÓN AGRESIVA: Si dice Pre Master en cualquier lado, unificar a MIXTO
        if (finalCategory.toUpperCase().includes("PRE MASTER") || finalCategory.toUpperCase().includes("PREMASTER")) {
          finalCategory = "PRE MASTER MIXTO";
        }

        let status = "✅ LISTO";
        let canAutoLink = false;

        if (!entryByDorsal && riderByName) {
          status = "💡 RECONOCIDO";
          canAutoLink = true;
        } else if (!entryByDorsal) {
          status = "❌ NO ENCONTRADO";
        }
        if (isDQ) status = "ℹ️ INFORMATIVO";

        const alreadySaved = existingResults.find(er => er.event_id === selectedEventId && er.rider_id === identifiedRiderId);
        let changeType = "NUEVO";
        let updateDetail = "";
        
        const normalizeTime = (t: string | null | undefined) => {
          if (!t) return '';
          let clean = t.trim().toUpperCase();
          if (clean.startsWith('0') && clean.includes(':')) clean = clean.substring(1);
          return clean;
        };

        if (alreadySaved) {
          const timeMatches = normalizeTime(alreadySaved.race_time) === normalizeTime(time);
          const posMatches = alreadySaved.position === (puesto ? parseInt(puesto) : 999);
          changeType = (timeMatches && posMatches) ? "SIN CAMBIOS" : "ACTUALIZAR";
          if (changeType === "ACTUALIZAR") {
            const timeDiff = !timeMatches ? `T: ${alreadySaved.race_time} → ${time}` : "";
            const posDiff = !posMatches ? `P: ${alreadySaved.position} → ${puesto || 'DQ'}` : "";
            updateDetail = [timeDiff, posDiff].filter(Boolean).join(" | ");
          }
        } else if (isDQ) {
          changeType = "DESCARTADO";
        }

        results.push({
          dorsal, puesto: puesto || '-', nameInText: rawName, identifiedName,
          category: finalCategory, time, isDQ, riderId: identifiedRiderId,
          exists: !!entryByDorsal, canAutoLink, status, changeType, updateDetail
        });
      });
    });

    return results;
  }, [importText, selectedEventId, eventRiders, riders, existingResults]);

  // Identificar quiénes están inscritos pero no aparecen en el PDF
  const missingFromPdf = useMemo(() => {
    return eventRiders.filter(er => 
      er.event_id === selectedEventId && 
      !detectedResults.some(dr => dr.riderId === er.rider_id)
    );
  }, [eventRiders, selectedEventId, detectedResults]);

  // Identificar líneas que parecen datos pero no se pudieron procesar (Logs amigables)
  const ignoredLines = useMemo(() => {
    if (!importText || !importText.trim()) return [];
    const ignored: string[] = [];
    const lines = importText.split(/\r?\n/);
    lines.forEach(line => {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.length < 2) return;
      
      const upper = cleanLine.toUpperCase();
      const catKeywords = ["MASTER", "ELITE", "NOVICIO", "DAMAS", "VARONES", "MIXTO", "PRO", "INFANTIL", "JUVENIL", "CADETE", "SUB", "EBIKE", "ENDURO"];
      const isNoise = upper.includes("PUESTO") || upper.includes("DORSAL") || upper.includes("PAGINA") || upper.includes("RESULTADOS") || upper.includes("OFICIAL") || upper.includes("TIEMPO");
      const isCategory = catKeywords.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/);
      const riderMatches = Array.from(cleanLine.matchAll(RIDER_REGEX));
      
      // Si no es categoría, no es un corredor válido, no es ruido evidente, pero tiene números (como un tiempo o dorsal)
      if (!isCategory && riderMatches.length === 0 && /\d/.test(cleanLine) && !isNoise && !upper.includes("CHASKI")) {
        ignored.push(cleanLine);
      }
    });
    return ignored;
  }, [importText]);

  const readyToSaveCount = detectedResults.filter(r => (r.exists || r.canAutoLink) && !r.isDQ && r.status !== "⚠️ DORSAL SOSPECHOSO").length;

  const timeToSeconds = (timeStr: string) => {
    if (timeStr.toUpperCase() === 'DQ') return 999999;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 999999;
  };

  const handleSaveResults = async () => {
    if (readyToSaveCount === 0) return;
    setLoading(true);
    try {
      const allDetected = importText ? detectedResults : []; 
      const toSave = detectedResults.filter(r => (r.exists || r.canAutoLink) && r.riderId && !r.isDQ);
      const toDelete = allDetected.filter(r => r.riderId && r.isDQ);
      
      let totalProcessed = 0;
      let totalDeleted = 0;

      // 1. LIMPIEZA: Borrar DQ si ya existían para dejar el ranking impecable
      for (const dqRider of toDelete) {
        const existing = existingResults.find(r => r.rider_id === dqRider.riderId && r.event_id === selectedEventId);
        if (existing) {
          await deleteResult(existing.id);
          totalDeleted++;
        }
      }

      // 2. GUARDADO: Procesar resultados válidos
      for (const item of toSave) {
          const finalPos = parseInt(item.puesto) || 999;
          
          if (item.canAutoLink) {
             await assignSingleDorsal(selectedEventId, item.riderId, item.dorsal, item.category);
          }

          await createResult({
            event_id: selectedEventId,
            rider_id: item.riderId,
            position: finalPos,
            points: calculatePoints(finalPos, false),
            category_played: item.category,
            race_time: item.time
          });
          totalProcessed++;
      }
      alert(`✅ Sincronización completa: Se guardaron ${totalProcessed} resultados y se ignoraron/limpiaron ${toDelete.length} registros DQ.`);
      setShowImportModal(false);
      setImportText('');
    } catch (e) { alert("Error al guardar resultados."); } finally { setLoading(false); }
  };

  const handleDeleteAll = async () => {
    if (!confirm(`⚠️ ¿Borrar TODOS los resultados de la categoría ${selectedCategory}?`)) return;
    setLoading(true);
    try {
        for (const res of currentViewResults) {
            await deleteResult(res.id);
        }
        alert("✅ Lista limpiada.");
    } catch (e) { alert("Error al limpiar."); } finally { setLoading(false); }
  };

  const inputClass = "w-full p-3 bg-white text-gray-900 rounded-lg border border-gray-300 outline-none focus:border-[#C64928] font-semibold text-sm";
  const labelClass = "block text-[11px] font-bold uppercase text-gray-500 mb-1 ml-1";

  return (
    <div className="p-2 sm:p-4 space-y-6">
      
      {/* CABECERA */}
      <div className="bg-[#1A1816] p-6 rounded-2xl shadow-lg border-b-4 border-[#C64928]">
        <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                <div className="space-y-1">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Seleccionar Evento</label>
                    <select value={selectedEventId} onChange={(e) => { setSelectedEventId(e.target.value); resetFormFull(); }} className="w-full p-3 rounded-lg bg-[#2A221B] text-white border border-white/10 font-bold text-sm">
                        {events.map(ev => <option key={ev.id} value={ev.id} className="text-black bg-white">{ev.name}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                    <label className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Categoría y Carga</label>
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
                      <button onClick={() => setShowImportModal(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-lg transition-all hover:scale-105">
                        IMPORTAR PDF
                      </button>
                      <div className="scale-100 origin-right ml-2">
                        <ExportExcelButton 
                          label="EXPORTAR RANKING"
                          data={existingResults
                            .filter(r => r.event_id === selectedEventId)
                            .sort((a, b) => a.category_played.localeCompare(b.category_played) || a.position - b.position)
                            .map(res => {
                              const rider = riders.find(r => r.id === res.rider_id);
                              return {
                                'Categoría': res.category_played,
                                'Posición': res.position === 999 ? 'DQ' : res.position,
                                'Corredor': rider?.full_name || 'Desconocido',
                                'RUT': rider?.rut ? formatRut(rider.rut) : '-',
                                'Club / Team': rider?.club || 'Independiente',
                                'Tiempo': res.race_time || '-',
                                'Puntos': res.points
                              };
                            })
                          } 
                          fileName={`Ranking_Completo_${currentEventName.replace(/\s+/g, '_')}`}
                        />
                      </div>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* ASISTENTE DE IMPORTACIÓN */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[32px] w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
            
            <div className="p-8 bg-[#F8F5F0] border-b flex justify-between items-center">
              <div>
                <h2 className="font-heading text-4xl text-[#1A1816] uppercase italic leading-none">Asistente de <span className="text-[#C64928]">Importación PDF</span></h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Carga automática de resultados oficiales</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportText(''); }} className="w-10 h-10 rounded-full bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-8">
              {!importText ? (
                <div className="border-4 border-dashed border-slate-200 rounded-[32px] p-20 text-center space-y-6 bg-slate-50/50">
                  <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mx-auto text-[#C64928]">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[#1A1816] font-black text-xl">Cargar Resultados desde PDF</p>
                    <p className="text-slate-500 text-sm">Selecciona el archivo oficial de RaceTime para procesar la fecha.</p>
                  </div>
                  <input type="file" accept=".pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) processPdfFile(file); }} className="hidden" id="pdf-input" disabled={loading} />
                  <label htmlFor="pdf-input" className="inline-block bg-[#1A1816] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#C64928] cursor-pointer shadow-lg transition-all active:scale-95">
                    {loading ? 'Leyendo Archivo...' : 'Seleccionar PDF'}
                  </label>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* DASHBOARD SUMMARY */}
                  <div className="bg-[#1A1816] p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden mb-8">
                    <div className="relative z-10">
                      <div className="flex items-center gap-3 mb-6">
                        <span className="bg-[#C64928] text-white text-[10px] font-black px-4 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-[#C64928]/20">Importando resultados para:</span>
                        <h3 className="text-2xl font-black uppercase italic tracking-tight text-white border-b-2 border-[#C64928] pb-1">{currentEventName}</h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/5 backdrop-blur-xl p-5 rounded-3xl border border-white/10">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Inscritos Web</p>
                          <p className="text-3xl font-black text-white">{eventRiders.filter(er => er.event_id === selectedEventId).length}</p>
                        </div>
                        <div className="bg-emerald-500/10 backdrop-blur-xl p-5 rounded-3xl border border-emerald-500/20">
                          <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-1">Listos</p>
                          <p className="text-3xl font-black text-emerald-400">{readyToSaveCount}</p>
                        </div>
                        <div className="bg-blue-500/10 backdrop-blur-xl p-5 rounded-3xl border border-blue-500/20">
                          <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Desc. (DQ)</p>
                          <p className="text-3xl font-black text-blue-400">{detectedResults.filter(r => r.isDQ).length}</p>
                        </div>
                        <div className={`backdrop-blur-xl p-5 rounded-3xl border ${detectedResults.length - (readyToSaveCount + detectedResults.filter(r => r.isDQ).length) > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-white/5 border-white/10'}`}>
                          <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest mb-1">Sin Vincular</p>
                          <p className="text-3xl font-black text-red-400">{detectedResults.length - (readyToSaveCount + detectedResults.filter(r => r.isDQ).length)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RESULTS TABLE */}
                  <div className="border border-slate-200 rounded-[24px] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-[#F8F5F0] text-[10px] font-black uppercase text-slate-400 border-b">
                        <tr>
                          <th className="p-4 text-center w-[60px]">Pos</th>
                          <th className="p-4 text-center w-[80px]">Dorsal</th>
                          <th className="p-4 text-left">Corredor Identificado</th>
                          <th className="p-4 text-center w-[120px]">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {Object.entries(
                          detectedResults.reduce<Record<string, any[]>>((acc, curr) => {
                            const cat = curr.category || 'SIN CATEGORÍA';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(curr);
                            return acc;
                          }, {})
                        ).map(([category, categoryResults]) => (
                          <Fragment key={category}>
                            <tr className="bg-slate-50">
                              <td colSpan={4} className="p-3 px-6 border-y border-slate-100">
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">{category}</span>
                                  <span className="text-[9px] font-bold text-slate-400 uppercase">{categoryResults.length} en PDF</span>
                                </div>
                              </td>
                            </tr>
                            {categoryResults.map((r, i) => (
                              <tr key={`${category}-${i}`} className={`group ${!r.riderId && !r.isDQ ? 'bg-red-50/50' : 'hover:bg-slate-50/50'} transition-colors`}> 
                                <td className="p-4 text-center font-bold">{r.puesto}</td>
                                <td className="p-4 text-center font-black text-lg">{r.dorsal}</td>
                                <td className="p-4">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className={`font-black uppercase text-base ${!r.riderId && !r.isDQ ? 'text-red-600' : 'text-[#1A1816]'}`}>{r.identifiedName || r.nameInText}</p>
                                      {r.status.includes('✅') && <span className="text-[9px] px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black uppercase tracking-tighter">Vinculado</span>}
                                      {r.status.includes('💡') && <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-black uppercase tracking-tighter">Sugerencia</span>}
                                      {!r.riderId && !r.isDQ && <span className="text-[9px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-black uppercase tracking-tighter italic">Revisar Nombre</span>}
                                      {r.changeType === "NUEVO" && <span className="text-[9px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-black border border-indigo-100 uppercase tracking-tighter">Nuevo</span>}
                                      {r.changeType === "ACTUALIZAR" && <span className="text-[9px] px-2 py-0.5 bg-orange-50 text-orange-600 rounded font-black border border-orange-100 uppercase tracking-tighter">Actualizar</span>}
                                      {r.changeType === "DESCARTADO" && <span className="text-[9px] px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-black border border-gray-200 uppercase tracking-tighter">Descartado</span>}
                                    </div>
                                    {r.updateDetail && <p className="text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded w-fit">{r.updateDetail}</p>}
                                    {!r.identifiedName && <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{r.nameInText}</p>}
                                  </div>
                                </td>
                                <td className="p-4 text-center font-mono font-black text-[#C64928] text-lg">{r.time}</td>
                              </tr>
                            ))}
                          </Fragment>
                        ))}
</tbody>
                    </table>
                  </div>

                  {/* MISSING FROM PDF */}
                  {missingFromPdf.length > 0 && (
                    <div className="mt-12 p-8 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl">
                      <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-6 text-center italic opacity-30">— Ausentes o Sin Registro ({missingFromPdf.length}) —</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {missingFromPdf.map((m, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col gap-2 hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#{m.dorsal || 'S/D'}</span>
                            </div>
                            <p className="text-sm font-black text-slate-700 uppercase leading-tight">{m.riders?.full_name}</p>
                            <p className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded w-fit">{m.category_at_event || 'SIN CATEGORÍA'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* IGNORED LINES (FRIENDLY LOGS) */}
                  {ignoredLines.length > 0 && (
                    <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-3xl">
                      <h3 className="text-sm font-black text-orange-800 uppercase tracking-tight mb-2 flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Líneas Ignoradas ({ignoredLines.length})
                      </h3>
                      <p className="text-xs text-orange-600 mb-4 font-medium">Estas líneas tienen formato no reconocido o son encabezados del PDF. Revisa si falta algún corredor importante aquí.</p>
                      <div className="bg-white rounded-xl border border-orange-100 max-h-40 overflow-y-auto p-3">
                        <ul className="divide-y divide-orange-50">
                          {ignoredLines.map((line, idx) => (
                            <li key={idx} className="py-1.5 text-[11px] font-mono text-slate-600">{line}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-8 bg-[#F8F5F0] border-t flex justify-end gap-4">
              <button onClick={() => setImportText('')} className="px-6 py-3 font-black text-xs uppercase text-slate-400 hover:text-slate-600">{importText ? 'Volver a intentar' : 'Cerrar'}</button>
              {importText && (
                <button onClick={handleSaveResults} disabled={readyToSaveCount === 0 || loading} className={`px-10 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl transition-all ${readyToSaveCount > 0 ? 'bg-[#C64928] text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
                  {loading ? 'Guardando...' : `Guardar ${readyToSaveCount} Resultados`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FORMULARIO */}
        <div className={`lg:col-span-5 p-6 rounded-2xl border ${isEditing ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-200'} shadow-sm h-fit`}>
            <h2 className="text-xs font-black text-gray-900 uppercase mb-6 italic">Ingreso Manual</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative" ref={searchContainerRef}>
                    <label className={labelClass}>Buscar Corredor</label>
                    <input type="text" value={searchTerm} onFocus={() => setShowDropdown(true)} onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); setSelectedRiderId(''); }} placeholder="Nombre o RUT..." className={inputClass} />
                    {showDropdown && (
                        <div className="absolute top-full left-0 w-full bg-white mt-1 rounded-lg shadow-2xl border border-gray-200 max-h-60 overflow-y-auto z-[99]">
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
                                <div className="p-3 text-center text-xs text-gray-500 italic">No hay resultados.</div>
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
                        <label className={labelClass}>Puntos</label>
                        <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} className={`${inputClass} text-center font-bold text-[#C64928]`} required />
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div><label className={labelClass}>Tiempo</label><input type="text" value={raceTime} onChange={handleTimeChange} className={`${inputClass} text-center font-mono`} placeholder="00:00:00" /></div>
                    <div><label className={labelClass}>Km/h</label><input type="number" step="0.1" value={avgSpeed} onChange={(e) => setAvgSpeed(e.target.value)} className={`${inputClass} text-center`} placeholder="0.0" /></div>
                </div>
                <button disabled={loading || !selectedRiderId} className={`w-full py-4 rounded-xl text-white font-bold uppercase text-xs tracking-widest transition-all ${isEditing ? 'bg-amber-500 hover:bg-amber-600' : 'bg-[#1A1816] hover:bg-[#C64928] disabled:opacity-30'}`}>
                    {loading ? 'Procesando...' : isEditing ? 'Actualizar' : 'Guardar'}
                </button>
            </form>
        </div>

        {/* LISTADO */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
            <div className="p-4 bg-gray-50 border-b border-gray-200 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                        <h3 className="text-xs font-black text-gray-900 uppercase">Tabla de Resultados</h3>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{selectedCategory}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentViewResults.length > 0 && (
                          <div className="scale-75 origin-right">
                             <ExportExcelButton data={datosParaExcel} fileName={nombreArchivoExcel} />
                          </div>
                      )}
                      {currentViewResults.length > 0 && (
                        <button onClick={handleDeleteAll} disabled={loading} className="p-2 text-red-400 hover:text-red-600 transition-colors" title="Borrar toda la categoría">
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>
                </div>
                <input type="text" value={filterTable} onChange={(e) => setFilterTable(e.target.value)} placeholder="Buscar en tabla..." className="w-full p-2 text-xs border rounded-md bg-white outline-none focus:border-[#C64928]" />
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left min-w-[450px]">
                    <tbody className="divide-y divide-gray-50">
                        {currentViewResults.length > 0 ? (
                            currentViewResults.map((res) => {
                                const rider = riders.find(r => r.id === res.rider_id);
                                return (
                                    <tr key={res.id} onClick={() => { setSelectedRiderId(res.rider_id); setSearchTerm(rider?.full_name || ''); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                                        <td className="p-4 text-center font-bold text-xl text-gray-900 italic w-16">
                                            {res.position === 999 ? (
                                                <span className="text-red-600 text-sm not-italic font-black bg-red-50 px-2 py-1 rounded">DQ</span>
                                            ) : (
                                                `${res.position}º`
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="text-xs font-black text-gray-900 uppercase">{rider?.full_name || 'Desconocido'}</div>
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
                            <tr><td colSpan={5} className="p-8 text-center text-xs text-gray-400 italic">Sin resultados.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}