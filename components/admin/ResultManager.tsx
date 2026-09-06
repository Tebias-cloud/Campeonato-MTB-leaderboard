'use client';

import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { createResult, deleteResult, bulkCreateResults } from '@/actions/results';
import { parseResultsText, RIDER_REGEX } from '@/lib/results-parser';
import { assignSingleDorsal, bulkAssignDorsals } from '@/actions/dorsals';
import { Event, Rider, RawResult } from '@/lib/definitions';
import ExportExcelButton from '@/components/admin/ExportExcelButton';

import { normalizeCategory, isNameCompatible, normalizeForMatch } from '@/lib/utils';
import { OFFICIAL_CATEGORIES, CATEGORY_GROUPS } from '@/lib/categories';
import { parseExcelRows } from '@/lib/excel-parser';
import { quickCreateRider } from '@/actions/riders';
import { matchAndDeduplicateResults, timeToSeconds, calculatePoints } from '@/lib/importer-core';

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
  const noClub = str.split('(')[0];
  return noClub.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9]/g, '');
};



const getRiderName = (er: any) => {
  if (!er?.riders) return null;
  if (Array.isArray(er.riders)) return er.riders[0]?.full_name;
  return er.riders.full_name;
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
  const [manualLinks, setManualLinks] = useState<Record<string, string>>({});
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

  // Estado del mini-formulario "Crear corredor" por fila (rowKey → datos del form)
  type QuickForm = { name: string; rut: string; club: string; category: string; saving: boolean };
  const [quickCreateForms, setQuickCreateForms] = useState<Record<string, QuickForm>>({});

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
      return fullText;
    } catch (error: any) { 
      throw error;
    }
  }

  const processExcelFile = async (file: File) => {
    try {
      const XLSX = await import('xlsx');
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheet = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheet];
      const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'hh:mm:ss' }) as any[][];

      const { text, warnings } = parseExcelRows(json, { fallbackCategory: "DESCONOCIDA" });

      if (warnings.length > 0) {
        console.warn('[Excel Import] Advertencias:', warnings);
      }

      return text;
    } catch (error: any) { 
      throw error; 
    }
  };

  const detectedResults = useMemo(() => {
    if (!importText || !importText.trim()) return [];

    const parsedRidersRaw = parseResultsText(importText, "DESCONOCIDA");
    const rawMatches = matchAndDeduplicateResults(
      parsedRidersRaw,
      eventRiders,
      riders,
      existingResults,
      selectedEventId,
      selectedCategory,
      manualLinks
    );

    // Separar los listos/DQs de los conflictos para no afectar la posición de los reales
    const valid = rawMatches.filter(r => !r.isDQ && !r.status.startsWith("⚠️") && !r.status.startsWith("❌"));
    const others = rawMatches.filter(r => r.isDQ || r.status.startsWith("⚠️") || r.status.startsWith("❌"));

    // Ordenar y asignar posición visual
    valid.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return timeToSeconds(a.time) - timeToSeconds(b.time);
    });

    const posCounters: Record<string, number> = {};
    const finalMatches: any[] = [...others];

    for (const item of valid) {
      if (!posCounters[item.category]) posCounters[item.category] = 1;
      const pos = posCounters[item.category]++;
      finalMatches.push({
        ...item,
        puesto: pos.toString(),
        calculatedPoints: calculatePoints(pos, false)
      });
    }

    // Devolver ordenados para la tabla: válidos primero (por categoría y pos), luego others
    return finalMatches.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      const posA = a.puesto === '-' ? 9999 : parseInt(a.puesto);
      const posB = b.puesto === '-' ? 9999 : parseInt(b.puesto);
      return posA - posB;
    });

  }, [importText, selectedEventId, eventRiders, riders, existingResults, manualLinks, selectedCategory]);

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
  const pendingCount = detectedResults.filter(r => (!r.riderId || r.status.startsWith("⚠️") || r.status.startsWith("❌")) && !r.isDQ).length;
  const readyToSaveCount = detectedResults.filter(r => (r.exists || r.canAutoLink) && r.riderId && !r.isDQ && !r.status.startsWith("⚠️")).length;

  const handleSaveResults = async () => {
    if (readyToSaveCount === 0 || pendingCount > 0) return;
    setLoading(true);
    try {
      const allDetected = importText ? detectedResults : [];
      const toSave = detectedResults.filter(r => (r.exists || r.canAutoLink) && r.riderId && !r.isDQ && !r.status.startsWith("⚠️"));
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

      // 2. GUARDADO: Procesar resultados válidos en lote
      const resultsToCreate = [];
      const dorsalsToAssign = [];
      const posCounters: Record<string, number> = {};

      // Ordenar globalmente por categoría y luego por tiempo real para asegurar cálculos precisos multiarchivo
      const sortedToSave = [...toSave].sort((a, b) => {
        if (a.category !== b.category) return a.category.localeCompare(b.category);
        return timeToSeconds(a.time) - timeToSeconds(b.time);
      });

      for (const item of sortedToSave) {
        let finalPos = parseInt(item.puesto);

        if (item.canAutoLink) {
          dorsalsToAssign.push({
            event_id: selectedEventId,
            rider_id: item.riderId,
            dorsal: item.dorsal.toString(),
            category_at_event: item.category
          });
        }

        resultsToCreate.push({
          event_id: selectedEventId,
          rider_id: item.riderId,
          position: finalPos,
          points: calculatePoints(finalPos, false),
          category_played: item.category,
          race_time: item.time
        });
        totalProcessed++;
      }
      
      // Llamadas masivas
      if (dorsalsToAssign.length > 0) {
        await bulkAssignDorsals(dorsalsToAssign);
      }
      
      if (resultsToCreate.length > 0) {
        await bulkCreateResults(resultsToCreate);
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
              <div className="flex flex-wrap xl:flex-nowrap gap-2">
                <select value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); resetFormFull(); }} className="flex-1 min-w-[200px] w-full p-3 rounded-lg bg-[#C64928] text-white font-bold text-sm appearance-none cursor-pointer">
                  {Object.entries(CATEGORY_GROUPS).map(([groupName, categoryList]) => (
                    <optgroup key={groupName} label={groupName.toUpperCase()} className="bg-white text-black">
                      {categoryList.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <button onClick={() => setShowImportModal(true)} className="flex-1 min-w-[140px] bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold text-[11px] uppercase tracking-widest shadow-lg transition-all hover:scale-105 whitespace-nowrap">
                  IMPORTAR
                </button>
                <div className="flex-1 min-w-[140px] scale-100 origin-center xl:origin-right flex justify-center">
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
        <div className="fixed inset-0 bg-black/90 z-[999] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
          <div className="bg-white rounded-[20px] sm:rounded-[32px] w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">

            <div className="p-4 sm:p-8 bg-[#F8F5F0] border-b flex justify-between items-center gap-2">
              <div>
                <h2 className="font-heading text-2xl sm:text-4xl text-[#1A1816] uppercase italic leading-none">Asistente de <span className="text-[#C64928]">Importación</span></h2>
                <p className="text-slate-500 text-[9px] sm:text-[10px] font-black uppercase tracking-widest mt-1">Carga automática de resultados · PDF / Excel / CSV</p>
              </div>
              <button onClick={() => { setShowImportModal(false); setImportText(''); setManualLinks({}); }} className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-full bg-white border flex items-center justify-center hover:bg-red-50 hover:text-red-600 transition-all">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-8">
              {!importText ? (
                /* ─── PASO 1: SUBIR ARCHIVO ─────────────────────────────────── */
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-6">
                  <label
                    htmlFor="pdf-input"
                    className={`w-full max-w-sm flex flex-col items-center gap-4 border-4 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all ${loading ? 'border-slate-200 bg-slate-50' : 'border-[#C64928]/30 bg-[#C64928]/5 hover:border-[#C64928] hover:bg-[#C64928]/10 active:scale-95'}`}
                  >
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-xl flex items-center justify-center text-[#C64928]">
                      {loading
                        ? <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                      }
                    </div>
                    <div>
                      <p className="text-[#1A1816] font-black text-lg">{loading ? 'Leyendo archivo...' : 'Subir resultados'}</p>
                      <p className="text-slate-500 text-sm mt-1">PDF, Excel (.xls / .xlsx) o CSV</p>
                    </div>
                    {!loading && <span className="bg-[#C64928] text-white px-6 py-3 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">Seleccionar archivo</span>}
                  </label>
                  <input type="file" multiple accept=".pdf, .xls, .xlsx, .csv" onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length === 0) return;
                    setLoading(true);
                    let allText = "";
                    try {
                      for (const file of files) {
                        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') { 
                          allText += (await processPdfFile(file)) + "\n";
                        } else { 
                          allText += (await processExcelFile(file)) + "\n";
                        }
                      }
                      if (!allText.trim()) {
                        alert('No se encontraron datos válidos en los archivos.');
                      } else {
                        setImportText(prev => prev ? prev + '\n' + allText : allText);
                      }
                    } catch(err: any) {
                      alert(`Error procesando archivos: ${err.message}`);
                    } finally {
                      setLoading(false);
                      e.target.value = '';
                    }
                  }} className="hidden" id="pdf-input" disabled={loading} />
                </div>
              ) : (
                /* ─── PASO 2: REVISIÓN Y CORRECCIÓN ─────────────────────────── */
                <div className="space-y-4">

                  {/* RESUMEN RÁPIDO */}
                  <div className="bg-[#1A1816] p-4 rounded-2xl text-white">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#C64928] text-white text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">Importando:</span>
                      <h3 className="font-black uppercase italic text-sm truncate">{currentEventName}</h3>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { label: 'Resultados detectados', value: detectedResults.length, color: 'bg-white/5 border-white/10', text: 'text-white' },
                        { label: '✓ Listos', value: readyToSaveCount, color: 'bg-emerald-500/15 border-emerald-500/30', text: 'text-emerald-400' },
                        { label: 'Requieren revisión', value: pendingCount, color: pendingCount > 0 ? 'bg-red-500/15 border-red-500/30' : 'bg-white/5 border-white/10', text: pendingCount > 0 ? 'text-red-400' : 'text-white' },
                        { label: 'Inscritos web', value: eventRiders.filter(er => er.event_id === selectedEventId).length, color: 'bg-white/5 border-white/10', text: 'text-slate-300' },
                      ].map(stat => (
                        <div key={stat.label} className={`${stat.color} border rounded-xl p-3`}>
                          <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">{stat.label}</p>
                          <p className={`text-2xl font-black ${stat.text}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── SECCIÓN PRIORITARIA: SIN VINCULAR ── */}
                  {pendingCount > 0 && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔴</span>
                        <div>
                          <p className="font-black text-red-700 text-sm uppercase tracking-tight">Revisar corredores</p>
                          <p className="text-red-500 text-xs">Estos corredores están en el archivo pero no se encontraron en el sistema de manera segura. Vincúlalos o créalos.</p>
                        </div>
                      </div>

                      {detectedResults.filter(r => (!r.riderId || r.status.startsWith("⚠️") || r.status.startsWith("❌")) && !r.isDQ).map((r) => (
                        <div key={r.rowKey} className="bg-white rounded-xl border border-red-100 p-3 space-y-3">
                          {/* Cabecera de la fila */}
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-black text-slate-800 uppercase text-sm leading-tight">{r.nameInText}</p>
                              {r.identifiedName && (
                                <p className="text-[10px] font-bold text-red-600 mt-1">
                                  Posible coincidencia: {r.identifiedName}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded">#{r.dorsal}</span>
                                <span className="text-[10px] font-bold text-slate-400">{r.category}</span>
                                <span className="text-[10px] font-mono font-bold text-[#C64928]">{r.time}</span>
                              </div>
                            </div>
                          </div>

                          {quickCreateForms[r.rowKey] ? (
                            /* Mini-formulario de creación */
                            <div className="space-y-2">
                              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Registrar nuevo corredor</p>
                              <input
                                value={quickCreateForms[r.rowKey].name}
                                onChange={e => setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], name: e.target.value } }))}
                                placeholder="Nombre completo *"
                                className="w-full p-3 border border-amber-300 rounded-xl text-sm bg-white text-slate-800 outline-none font-semibold focus:border-amber-500"
                              />
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  value={quickCreateForms[r.rowKey].rut}
                                  onChange={e => setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], rut: e.target.value } }))}
                                  placeholder="RUT (opcional)"
                                  className="p-3 border border-amber-300 rounded-xl text-sm bg-white text-slate-800 outline-none font-semibold focus:border-amber-500"
                                />
                                <input
                                  value={quickCreateForms[r.rowKey].club}
                                  onChange={e => setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], club: e.target.value } }))}
                                  placeholder="Club (opcional)"
                                  className="p-3 border border-amber-300 rounded-xl text-sm bg-white text-slate-800 outline-none font-semibold focus:border-amber-500"
                                />
                              </div>
                              <select
                                value={quickCreateForms[r.rowKey].category}
                                onChange={e => setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], category: e.target.value } }))}
                                className="w-full p-3 border border-amber-300 rounded-xl text-sm bg-white text-slate-800 outline-none font-semibold focus:border-amber-500"
                              >
                                {Object.entries(CATEGORY_GROUPS).map(([groupName, categoryList]) => (
                                  <optgroup key={groupName} label={groupName}>
                                    {categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                                  </optgroup>
                                ))}
                              </select>
                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  onClick={() => setQuickCreateForms(prev => { const n = { ...prev }; delete n[r.rowKey]; return n; })}
                                  className="py-3 text-sm font-black text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 active:scale-95"
                                >Cancelar</button>
                                <button
                                  disabled={quickCreateForms[r.rowKey].saving}
                                  onClick={async () => {
                                    const form = quickCreateForms[r.rowKey];
                                    setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], saving: true } }));
                                    const result = await quickCreateRider({ full_name: form.name, category: form.category, club: form.club, rut: form.rut, eventId: selectedEventId, dorsal: r.dorsal });
                                    if (result.success && result.riderId) {
                                      setManualLinks(prev => ({ ...prev, [r.rowKey]: result.riderId! }));
                                      setQuickCreateForms(prev => { const n = { ...prev }; delete n[r.rowKey]; return n; });
                                    } else {
                                      alert(result.message || 'Error al crear corredor.');
                                      setQuickCreateForms(prev => ({ ...prev, [r.rowKey]: { ...prev[r.rowKey], saving: false } }));
                                    }
                                  }}
                                  className="py-3 text-sm font-black text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl disabled:opacity-50 active:scale-95"
                                >{quickCreateForms[r.rowKey].saving ? 'Creando...' : '✓ Crear y Vincular'}</button>
                              </div>
                            </div>
                          ) : (
                            /* Botones de acción */
                            <div className="flex flex-col sm:flex-row gap-2 relative">
                              <div className="flex-1 relative">
                                <input
                                  placeholder="O buscar corredor existente..."
                                  className="w-full p-3 border border-slate-200 rounded-xl text-sm bg-white focus:bg-slate-50 text-slate-800 outline-none font-semibold focus:border-slate-400"
                                  onChange={(e) => {
                                    const val = e.target.value.toLowerCase();
                                    const dropdown = document.getElementById(`dropdown-${r.rowKey}`);
                                    if (!val) {
                                      if (dropdown) dropdown.style.display = 'none';
                                      return;
                                    }
                                    const matches = riders.filter(rider => rider.full_name.toLowerCase().includes(val) || (rider.rut && rider.rut.includes(val))).slice(0, 5);
                                    
                                    if (dropdown) {
                                      if (matches.length > 0) {
                                        dropdown.style.display = 'block';
                                        dropdown.innerHTML = '';
                                        matches.forEach(match => {
                                          const btn = document.createElement('button');
                                          btn.className = 'w-full text-left px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 border-b border-slate-50 last:border-0';
                                          btn.innerHTML = `${match.full_name} <span class="text-[10px] text-slate-400 font-normal block">${formatRut(match.rut) || 'Sin RUT'} • ${match.category || ''}</span>`;
                                          btn.onclick = () => {
                                            setManualLinks(prev => ({ ...prev, [r.rowKey]: match.id }));
                                            setQuickCreateForms(prev => { const n = { ...prev }; delete n[r.rowKey]; return n; });
                                          };
                                          dropdown.appendChild(btn);
                                        });
                                      } else {
                                        dropdown.style.display = 'none';
                                      }
                                    }
                                  }}
                                />
                                <div id={`dropdown-${r.rowKey}`} className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden" style={{ display: 'none' }}></div>
                              </div>
                              <button
                                onClick={() => setQuickCreateForms(prev => ({
                                  ...prev,
                                  [r.rowKey]: { name: r.nameInText, rut: '', club: '', category: r.category || selectedCategory, saving: false }
                                }))}
                                className="py-3 px-4 text-sm font-black text-white bg-[#C64928] hover:bg-[#a83820] rounded-xl transition-colors active:scale-95 whitespace-nowrap"
                              >Crear nuevo / No es esta persona</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── TABLA COMPLETA (CORREDORES LISTOS) ── */}
                  <details open className="group">
                    <summary className="flex items-center justify-between p-3 bg-slate-100 rounded-xl cursor-pointer select-none list-none">
                      <span className="font-black text-slate-700 text-sm uppercase tracking-tight">Ver corredores listos ({readyToSaveCount + detectedResults.filter(r => r.isDQ).length})</span>
                      <svg className="w-4 h-4 text-slate-500 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </summary>
                    <div className="mt-2 space-y-2">
                      {Object.entries(
                        detectedResults
                          .filter(r => r.isDQ || ((r.exists || r.canAutoLink) && r.riderId && !r.status.startsWith("⚠️")))
                          .reduce<Record<string, any[]>>((acc, curr) => {
                            const cat = curr.category || 'SIN CATEGORÍA';
                            if (!acc[cat]) acc[cat] = [];
                            acc[cat].push(curr);
                            return acc;
                          }, {})
                      ).map(([category, categoryResults]) => (
                        <div key={category} className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
                          <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-100">
                            <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{category}</span>
                            <span className="text-[9px] font-bold text-slate-400">{categoryResults.length} corredores</span>
                          </div>
                          <div className="divide-y divide-slate-50">
                            {categoryResults.map((r, i) => (
                              <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${(!r.riderId || r.status === "⚠️ DORSAL SOSPECHOSO") && !r.isDQ ? 'bg-red-50/50' : ''}`}>
                                <span className="text-xs font-bold text-slate-400 w-5 text-right shrink-0">{r.puesto}</span>
                                <span className="text-sm font-black text-slate-600 w-7 shrink-0">#{r.dorsal}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`font-black uppercase text-sm leading-tight truncate ${r.riderId ? 'text-slate-800' : 'text-red-600'}`}>
                                    {r.identifiedName || r.nameInText}
                                  </p>
                                  {r.updateDetail && <p className="text-[10px] text-orange-500 font-bold">{r.updateDetail}</p>}
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className="font-mono font-bold text-[#C64928] text-xs">{r.time}</span>
                                  {r.riderId && <span className="text-emerald-500 text-sm">✓</span>}
                                  {(!r.riderId || r.status === "⚠️ DORSAL SOSPECHOSO") && !r.isDQ && <span className="text-red-400 text-xs">↑</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </details>

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

            <div className="p-4 sm:p-8 bg-[#F8F5F0] border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
              <button onClick={() => setImportText('')} className="w-full sm:w-auto px-6 py-3 sm:py-3 font-black text-xs uppercase text-slate-400 hover:text-slate-600 border sm:border-none border-slate-300 rounded-xl sm:rounded-none bg-white sm:bg-transparent">{importText ? 'Volver a intentar' : 'Cerrar'}</button>
              {importText && (
                <button 
                  onClick={handleSaveResults} 
                  disabled={readyToSaveCount === 0 || loading || pendingCount > 0} 
                  className={`w-full sm:w-auto px-6 sm:px-10 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm uppercase tracking-widest shadow-xl transition-all ${readyToSaveCount > 0 && pendingCount === 0 ? 'bg-[#C64928] text-white hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
                >
                  {pendingCount > 0 
                    ? 'Resuelve los pendientes'
                    : loading 
                      ? 'Guardando...' 
                      : `Guardar ${readyToSaveCount} Resultados`}
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