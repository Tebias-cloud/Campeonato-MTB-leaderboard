'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { updateLiveResults } from '@/actions/liveResults'; // KEEP IMPORT FOR NOW IN CASE BUILD FAILS ELSEWHERE, BUT WE WON'T USE IT HERE
import { parseExcelRows } from '@/lib/excel-parser';
import { parseResultsText } from '@/lib/results-parser';
import { normalizeCategory } from '@/lib/utils';
import { timeToSeconds, matchAndDeduplicateResults } from '@/lib/importer-core';

interface LiveResultsModalProps {
  eventId: string;
  eventName: string;
  isOpen: boolean;
  onClose: () => void;
  isAdmin?: boolean;
}

const normalize = (str: string | null | undefined) => {
  if (!str) return '';
  return str.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export default function LiveResultsModal({ eventId, eventName, isOpen, onClose, isAdmin = false }: LiveResultsModalProps) {
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [eventRiders, setEventRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [accumulatedRawRiders, setAccumulatedRawRiders] = useState<any[]>([]);

  const fetchData = useCallback(async () => {
    if (!isAdmin) return;
    setLoading(true);
    try {
      const responses = await Promise.all([
        supabase.from('riders').select('id, full_name, club, category, rut'),
        supabase.from('event_riders').select('*, riders(full_name, category)').eq('event_id', eventId)
      ]);

      if (responses[0]?.data) setAllRiders(responses[0].data);
      if (responses[1]?.data) setEventRiders(responses[1].data);
    } catch (error) {
      console.error("Error fetching live results dependencies:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, isAdmin]);

  useEffect(() => {
    if (!isOpen || !eventId) return;
    fetchData();
  }, [isOpen, eventId, fetchData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setLoading(true);
    try {
      let fileRiders: any[] = [];

      for (const file of files) {
        let fileText = '';
        if (file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf') {
          await new Promise<void>((resolve, reject) => {
            if ((window as any).pdfjsLib) return resolve();
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('No se pudo cargar el motor PDF.'));
            document.body.appendChild(script);
          });
          const pdfjsLib = (window as any)['pdfjsLib'];
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
          const arrayBuffer = await file.arrayBuffer();
          const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
          const pdf = await loadingTask.promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fileText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
          }
        } else {
          const XLSX = await import('xlsx');
          const arrayBuffer = await file.arrayBuffer();
          const workbook = XLSX.read(arrayBuffer, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'hh:mm:ss' }) as any[][];

          const { text, warnings } = parseExcelRows(json, { fallbackCategory: 'DESCONOCIDA' });
          if (warnings.length > 0) console.warn('[Live Excel Import]', warnings);
          fileText = text;
        }

        if (fileText.trim()) {
          const parsed = parseResultsText(fileText, 'DESCONOCIDA');
          fileRiders = [...fileRiders, ...parsed];
        }
      }

      if (fileRiders.length === 0) {
        alert('No se encontraron datos válidos en los archivos.');
        setLoading(false);
        return;
      }

      // ── Acumular objetos parseados estructurados, nunca texto ────────────
      setAccumulatedRawRiders(prev => [...prev, ...fileRiders]);
      setLoading(false);
      e.target.value = '';
    } catch (error: any) {
      alert(`Error al importar: ${error.message}`);
      setLoading(false);
    }
  };

  const handleClearLiveResults = () => {
    if (!confirm("¿Seguro que quieres borrar todos los resultados temporales?")) return;
    setAccumulatedRawRiders([]);
  };

  const computedResults = useMemo(() => {
    if (accumulatedRawRiders.length === 0) return [];

    const rawMatches = matchAndDeduplicateResults(
      accumulatedRawRiders,
      eventRiders,
      allRiders,
      [], 
      eventId,
      "",
      {} 
    );

    const valid = rawMatches.filter(r => !r.isDQ && !r.status.startsWith("❌"));

    valid.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return timeToSeconds(a.time) - timeToSeconds(b.time);
    });

    const posCounters: Record<string, number> = {};
    const finalMatches: any[] = [];

    for (const item of valid) {
      if (!posCounters[item.category]) posCounters[item.category] = 1;
      const pos = posCounters[item.category]++;
      finalMatches.push({
        ...item,
        visualPosition: pos
      });
    }

    return finalMatches;
  }, [accumulatedRawRiders, eventRiders, allRiders, eventId]);

  if (!isOpen) return null;

  // Agrupar por categoría
  const grouped = computedResults.reduce((acc: any, curr: any) => {
    const cat = curr.category || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-2 sm:p-6 bg-black/80 backdrop-blur-sm animate-fade-in-up">
      <div className="bg-[#1A1816] w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] rounded-[20px] sm:rounded-[32px] overflow-hidden flex flex-col shadow-2xl border border-white/10 relative">

        {/* HEADER */}
        <div className="bg-[#C64928] p-4 sm:p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0 relative">
          <div className="w-full sm:w-auto pr-8 sm:pr-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="relative flex h-3 w-3 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
              </span>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-black/20 px-2 py-1 rounded-md whitespace-nowrap">Transmisión en Vivo</span>
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl uppercase italic leading-none line-clamp-2">{eventName}</h2>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
            {isAdmin && (
              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  accept=".pdf, .xls, .xlsx, .csv"
                  id="pdf-live-upload"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loading}
                />
                <label
                  htmlFor="pdf-live-upload"
                  className="bg-white text-[#C64928] hover:bg-slate-100 px-3 sm:px-4 py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer shadow-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  {loading ? 'Procesando...' : 'Subir Archivo'}
                </label>
                <button
                  onClick={handleClearLiveResults}
                  disabled={loading}
                  className="bg-black/20 text-white hover:bg-red-600/80 px-3 sm:px-4 py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all"
                >
                  Limpiar
                </button>
              </div>
            )}
            <button onClick={onClose} className="absolute sm:relative top-4 right-4 sm:top-0 sm:right-0 w-8 h-8 sm:w-10 sm:h-10 bg-black/20 hover:bg-black/40 rounded-full flex items-center justify-center transition-all text-white font-bold shrink-0">
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-6 bg-[#F8F5F0]">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#C64928]"></div>
            </div>
          ) : computedResults.length === 0 ? (
            <div className="text-center py-20 flex flex-col items-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-200 mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <p className="font-heading text-3xl md:text-4xl uppercase text-slate-800">Aún no hay resultados</p>
              <p className="text-sm md:text-base text-slate-500 mt-2 font-medium">El cronometraje no ha subido los datos todavía.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.keys(grouped).sort().map(cat => (
                <div key={cat} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                    <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">{cat}</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm min-w-[300px]">
                      <thead className="bg-white text-[9px] sm:text-[10px] font-black uppercase text-slate-400 border-b">
                        <tr>
                          <th className="p-2 sm:p-3 text-center w-10 sm:w-16">Pos</th>
                          <th className="p-2 sm:p-3">Corredor</th>
                          <th className="p-2 sm:p-3 text-center w-20 sm:w-24">Tiempo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {grouped[cat].map((r: any, i: number) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 sm:p-3 text-center font-bold text-slate-600 text-[11px] sm:text-sm">
                              {r.visualPosition === 'DQ' ? 'DQ' : `${r.visualPosition}º`}
                            </td>
                            <td className="p-2 sm:p-3">
                              <p className="font-black uppercase text-slate-800 text-[11px] sm:text-sm">
                                {r.identifiedName || r.nameInText}
                                {r.status?.startsWith("⚠️") && <span className="ml-2 text-orange-500" title={r.status}>⚠️</span>}
                              </p>
                              {(r.clubAtEvent || r.clubInText) && <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">{r.clubAtEvent || r.clubInText}</p>}
                            </td>
                            <td className="p-2 sm:p-3 text-center font-mono font-black text-[#C64928] text-[11px] sm:text-sm">
                              {r.time || '--:--:--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t border-slate-200 text-center shrink-0">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            {isAdmin ? 'Añade el PDF para actualizar los tiempos de inmediato' : 'Tiempos sujetos a cambios por revisión de jueces'}
          </p>
        </div>
      </div>
    </div>
  );
}
