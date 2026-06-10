'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { updateLiveResults } from '@/actions/liveResults';

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

const RIDER_REGEX = new RegExp("(?:(\\d+)\\s+)?(\\d+)\\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ\\s()\\.#&\\'\\/-]{3,})\\s+(\\d{1,2}:[\\d:.]+|DQ)", "gi");

export default function LiveResultsModal({ eventId, eventName, isOpen, onClose, isAdmin = false }: LiveResultsModalProps) {
  const [results, setResults] = useState<any[]>([]);
  const [allRiders, setAllRiders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const promises: any[] = [
        supabase.from('events').select('live_results_json').eq('id', eventId).single()
      ];
      
      if (isAdmin) {
         promises.push(supabase.from('riders').select('id, full_name, club, category'));
      }

      const responses = await Promise.all(promises);
      const eventData = responses[0].data;
      
      if (isAdmin && responses[1]?.data) {
        setAllRiders(responses[1].data);
      }

      if (eventData?.live_results_json) {
         // Asegurarse de que sea un array
         const parsed = Array.isArray(eventData.live_results_json) ? eventData.live_results_json : [];
         setResults(parsed);
      } else {
         setResults([]);
      }
    } catch (error) {
      console.error("Error fetching live results:", error);
    } finally {
      setLoading(false);
    }
  }, [eventId, isAdmin]);

  useEffect(() => {
    if (!isOpen || !eventId) return;
    fetchData();
  }, [isOpen, eventId, fetchData]);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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

      let posCounter = 1;
      let currentCategory = "DESCONOCIDA";
      const liveResults: any[] = [];
      const lines = fullText.split(/\r?\n/);

      // REINICIAR el estado global de la expresión regular
      RIDER_REGEX.lastIndex = 0;

      lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine || cleanLine.length < 2) return;

        // 1. Detectar Categoría
        const upper = cleanLine.toUpperCase();
        const catKeywords = ["MASTER", "ELITE", "NOVICIO", "DAMAS", "VARONES", "MIXTO", "PRO", "INFANTIL", "JUVENIL", "CADETE", "SUB", "EBIKE", "ENDURO"];
        const isNoise = upper.includes("PUESTO") || upper.includes("DORSAL") || upper.includes("PAGINA") || upper.includes("RESULTADOS") || upper.includes("OFICIAL") || upper.includes("TIEMPO");
        
        if (catKeywords.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/)) {
          let detected = upper.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|RESULTADOS|FECHA)\s*[:\-]?\s*/i, "").trim();
          if (detected.includes("PRE MASTER") || detected.includes("PREMASTER")) detected = "PRE MASTER MIXTO";
          currentCategory = detected;
          posCounter = 1; // Reiniciar contador por categoría
          return;
        }

        // 2. Extraer Tiempos
        const riderMatches = Array.from(cleanLine.matchAll(RIDER_REGEX));
        riderMatches.forEach(match => {
          const posText = match[1];
          const dorsal = match[2];
          const rawName = match[3].trim().toUpperCase();
          const time = match[4].toUpperCase();

          if (dorsal.length === 4 && dorsal.startsWith("20")) return;
          if (rawName.includes("PUESTO") || rawName.includes("DORSAL")) return;

          const isDQ = time === 'DQ';
          const position = isDQ ? 999 : (posText ? parseInt(posText, 10) : posCounter++);
          const nameInText = rawName.split('(')[0].trim();

          const cleanRaw = normalize(nameInText);
          const matchedRider = allRiders.find(r => normalize(r.full_name) === cleanRaw);

          liveResults.push({
            id: (matchedRider?.id || "temp") + "-" + Date.now() + Math.random(),
            rider_id: matchedRider?.id || null,
            rider_name: nameInText, 
            club: matchedRider?.club || '',
            category_played: currentCategory !== "DESCONOCIDA" ? currentCategory : (matchedRider?.category || 'Sin Categoría'),
            position: position,
            race_time: time
          });
        });
      });

      // Guardar JSON usando un Server Action para evitar problemas de permisos (RLS)
      await updateLiveResults(eventId, liveResults);

      await fetchData(); // Recargar datos
      
      // Limpiar input
      e.target.value = '';
    } catch (error: any) {
      alert(`Error al importar: ${error.message}`);
      setLoading(false);
    }
  };

  const handleClearLiveResults = async () => {
    if (!confirm("¿Seguro que quieres borrar todos los resultados en vivo de esta carrera?")) return;
    setLoading(true);
    try {
      await updateLiveResults(eventId, []);
      await fetchData();
    } catch (error: any) {
      alert(`Error al limpiar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Agrupar por categoría
  const grouped = results.reduce((acc: any, curr: any) => {
    const cat = curr.category_played || 'Sin Categoría';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(curr);
    return acc;
  }, {});

  // Ordenar dentro de cada categoría
  Object.keys(grouped).forEach(cat => {
    grouped[cat].sort((a: any, b: any) => a.position - b.position);
  });

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
                  accept=".pdf" 
                  id="pdf-live-upload" 
                  className="hidden" 
                  onChange={handlePdfUpload}
                  disabled={loading}
                />
                <label 
                  htmlFor="pdf-live-upload" 
                  className="bg-white text-[#C64928] hover:bg-slate-100 px-3 sm:px-4 py-2 rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-widest cursor-pointer shadow-lg transition-all active:scale-95 whitespace-nowrap"
                >
                  {loading ? 'Procesando...' : 'Subir PDF'}
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
          ) : results.length === 0 ? (
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
                              {r.position === 999 ? 'DQ' : `${r.position}º`}
                            </td>
                            <td className="p-2 sm:p-3">
                              <p className="font-black uppercase text-slate-800 text-[11px] sm:text-sm">{r.rider_name}</p>
                              {r.club && <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase">{r.club}</p>}
                            </td>
                            <td className="p-2 sm:p-3 text-center font-mono font-black text-[#C64928] text-[11px] sm:text-sm">
                              {r.race_time || '--:--:--'}
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
