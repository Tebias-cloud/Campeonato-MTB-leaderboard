'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { createResult, deleteResult } from '@/actions/results';
import { Event, Rider, RawResult } from '@/lib/definitions';

interface Props {
  events: Event[];
  riders: Rider[]; 
  existingResults: RawResult[];
}

export default function ResultManager({ events, riders, existingResults }: Props) {
  // --- ESTADOS ---
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('Novicios Open');
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  
  // Buscador
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // Datos
  const [position, setPosition] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  const [raceTime, setRaceTime] = useState<string>('');
  const [avgSpeed, setAvgSpeed] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- 1. FILTRADO ---
  const filteredRiders = useMemo(() => {
    const candidates = riders.filter(r => r.category === selectedCategory);

    if (!searchTerm) {
        return candidates.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    const term = searchTerm.toLowerCase();
    return candidates.filter(r => 
        r.full_name.toLowerCase().includes(term) || 
        (r.rut && r.rut.toLowerCase().includes(term)) ||
        (r.club && r.club.toLowerCase().includes(term))
    ).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [riders, selectedCategory, searchTerm]);

  const currentViewResults = existingResults.filter(r => 
    r.event_id === selectedEventId && 
    r.category_played === selectedCategory
  ).sort((a, b) => a.position - b.position);

  // --- 2. AUTO-EDICIÓN ---
  useEffect(() => {
    if (!selectedRiderId || !selectedEventId) {
        if (!selectedRiderId) resetDataFields();
        return;
    }

    const existing = existingResults.find(r => 
        r.event_id === selectedEventId && 
        r.rider_id === selectedRiderId
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRiderId, selectedEventId, existingResults]);

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetDataFields = () => {
      setPosition('');
      setPoints('');
      setRaceTime('');
      setAvgSpeed('');
  };

  const resetFormFull = () => {
      setIsEditing(false);
      resetDataFields();
      setSelectedRiderId('');
      setSearchTerm('');
  };

  const handleSelectRider = (rider: Rider) => {
      setSelectedRiderId(rider.id);
      setSearchTerm(rider.full_name); 
      setIsSearching(false); 
  };

  const handleClearSearch = () => {
      setSearchTerm('');
      setSelectedRiderId('');
      setIsSearching(true);
      resetDataFields();
  };

  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPosition(val);
      const pos = parseInt(val);
      if (!isNaN(pos) && pos > 0) {
          let calcPoints = 0;
          if (pos <= 10) calcPoints = 110 - (pos * 10);
          else if (pos < 20) calcPoints = 20 - pos;
          else calcPoints = 1;
          setPoints(calcPoints.toString());
      } else {
          setPoints('');
      }
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
    if (!selectedEventId || !selectedRiderId || !position || !points) return;

    setLoading(true);
    try {
      await createResult({
        event_id: selectedEventId,
        rider_id: selectedRiderId,
        position: parseInt(position),
        points: parseInt(points),
        category_played: selectedCategory,
        race_time: raceTime || null,
        avg_speed: avgSpeed ? parseFloat(avgSpeed) : null
      });
      
      resetFormFull(); 
      alert(isEditing ? "¡Actualizado!" : "¡Registrado!");

    } catch (error) {
        console.error(error);
        alert("Ocurrió un error al guardar.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (resultId: string) => {
    if (!confirm('¿Borrar este resultado permanentemente?')) return;
    await deleteResult(resultId);
    if (isEditing) resetFormFull();
  };

  const inputClass = "w-full p-3 bg-white text-gray-900 rounded-xl border border-gray-300 outline-none focus:border-[#C64928] font-medium transition-all placeholder:text-gray-400";
  const labelClass = "block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wide";

  return (
    <div className="space-y-8">
      
      {/* 1. CONFIGURACIÓN */}
      <div className="bg-[#1A1816] p-6 md:p-8 rounded-3xl shadow-xl border-b-8 border-[#C64928]">
        <h2 className="font-heading text-3xl text-white uppercase mb-6 flex items-center gap-2">
            <span className="text-[#C64928]">1.</span> Configuración
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
                <label className="text-gray-400 text-xs font-bold uppercase mb-2 block">Fecha del Evento</label>
                <select 
                    value={selectedEventId} 
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full p-3 rounded-xl border border-white/20 bg-[#2A221B] text-white focus:outline-none focus:border-[#C64928]"
                >
                    {events.map(ev => (
                        <option key={ev.id} value={ev.id} className="text-black bg-white">
                            {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-CL')} — {ev.name}
                        </option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-gray-400 text-xs font-bold uppercase mb-2 block">Categoría a Juzgar</label>
                <select 
                    value={selectedCategory} 
                    onChange={(e) => {
                        setSelectedCategory(e.target.value);
                        resetFormFull();
                    }}
                    className="w-full p-3 rounded-xl border border-[#C64928] bg-[#C64928] text-white font-bold shadow-lg focus:outline-none focus:ring-4 ring-[#C64928]/30"
                >
                     <optgroup label="Varones" className="bg-white text-black">
                        <option value="Novicios Open">Novicios Open</option>
                        <option value="Pre Master">Pre Master (16-29)</option>
                        <option value="Master A">Master A (30-39)</option>
                        <option value="Master B">Master B (40-49)</option>
                        <option value="Master C">Master C (50-59)</option>
                        <option value="Master D">Master D (60+)</option>
                        <option value="Elite Open">Elite Open</option>
                    </optgroup>
                    <optgroup label="Damas" className="bg-white text-black">
                        <option value="Novicias Open">Novicias Open</option>
                        <option value="Damas Pre Master">Damas Pre Master (16-29)</option>
                        <option value="Damas Master A">Damas Master A (30-39)</option>
                        <option value="Damas Master B">Damas Master B (40-49)</option>
                        <option value="Damas Master D">Damas Master D (50+)</option>
                    </optgroup>
                    <optgroup label="Mixtas" className="bg-white text-black">
                        <option value="Enduro Open Mixto">Enduro Open Mixto</option>
                        <option value="E-Bike Open Mixto">E-Bike Open Mixto</option>
                    </optgroup>
                </select>
            </div>
        </div>
      </div>

      {/* 2. FORMULARIO */}
      <div className={`p-6 md:p-8 rounded-3xl shadow-lg border relative overflow-visible transition-colors duration-500 ${
          isEditing ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
      }`}>
        {isEditing && (
             <div className="absolute top-0 right-0 bg-amber-200 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-bl-xl border-l border-b border-amber-300 uppercase">
                 Editando Registro Existente
             </div>
        )}

        <div className="flex justify-between items-center mb-6 pl-2">
            <h2 className="font-heading text-2xl text-[#1A1816] uppercase">2. Ingresar Resultados</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* --- SELECCIONADOR --- */}
                <div className="md:col-span-1 relative z-50" ref={searchContainerRef}>
                    <label className={labelClass}>
                        Seleccionar Corredor <span className="text-gray-400 font-normal">({filteredRiders.length})</span>
                    </label>
                    
                    <div className="relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onClick={() => setIsSearching(true)} 
                            onFocus={() => setIsSearching(true)}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsSearching(true);
                                setSelectedRiderId(''); 
                            }}
                            placeholder="Buscar nombre o RUT..."
                            // LÓGICA DE BORDES: Si está buscando, quitamos el borde inferior y las esquinas redondeadas de abajo
                            className={`w-full p-3 pl-4 pr-10 bg-white border cursor-pointer focus:outline-none focus:ring-0 transition-all z-20 relative ${
                                selectedRiderId 
                                    ? 'border-[#C64928] text-[#1A1816] font-bold rounded-xl' 
                                    : isSearching && searchTerm 
                                        ? 'border-[#C64928] rounded-t-xl rounded-b-none border-b-0 shadow-lg' 
                                        : 'border-gray-300 rounded-xl focus:border-[#C64928]'
                            }`}
                        />
                        
                        <div className="absolute right-3 top-3.5 text-gray-400 cursor-pointer pointer-events-none z-30">
                             {searchTerm ? (
                                 <svg onClick={handleClearSearch} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 hover:text-red-500 transition-colors pointer-events-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                             ) : (
                                 <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform ${isSearching ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                             )}
                        </div>
                    </div>

                    {/* LISTA DESPLEGABLE - SIN ESPACIO Y CON BORDES A JUEGO */}
                    {isSearching && (
                        <div className="absolute top-full left-0 w-full mt-0 bg-white rounded-b-xl shadow-2xl border-x border-b border-[#C64928] max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100 overflow-hidden z-[100]"> 
                            
                            {filteredRiders.length > 0 ? (
                                <div>
                                    {filteredRiders.map(r => (
                                        <div 
                                            key={r.id}
                                            onClick={() => handleSelectRider(r)}
                                            className={`px-4 py-3 cursor-pointer border-b border-gray-100 transition-colors group flex justify-between items-center ${
                                                r.id === selectedRiderId ? 'bg-amber-50' : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm ${r.id === selectedRiderId ? 'text-[#C64928]' : 'text-[#1A1816]'}`}>
                                                    {r.full_name}
                                                </span>
                                                <span className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">
                                                    {r.club || 'Sin Club'}
                                                </span>
                                            </div>
                                            
                                            {/* RUT MUCHO MÁS VISIBLE */}
                                            {r.rut && (
                                                <span className="font-mono text-xs font-bold text-black bg-gray-200 px-2 py-1 rounded ml-3 whitespace-nowrap border border-gray-300 shadow-sm">
                                                    {r.rut}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-4 text-center text-gray-400 text-sm italic">
                                    No se encontraron corredores.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* COLUMNA 2: POSICIÓN Y PUNTOS */}
                <div className="grid grid-cols-2 gap-4 md:gap-6 md:col-span-2">
                    <div>
                        <label className={labelClass}>Posición</label>
                        <input 
                            type="number" 
                            value={position} 
                            onChange={handlePositionChange}
                            className={inputClass}
                            placeholder="#"
                            min="1"
                            required 
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Puntos (Auto)</label>
                        <input 
                            type="number" 
                            value={points} 
                            onChange={(e) => setPoints(e.target.value)}
                            className={`${inputClass} bg-gray-50 font-bold`}
                            placeholder="Pts"
                            required 
                        />
                    </div>
                    
                    {/* DATOS TÉCNICOS */}
                    <div>
                        <label className={labelClass}>Tiempo (Opcional)</label>
                        <input 
                            type="text" 
                            value={raceTime} 
                            onChange={handleTimeChange} 
                            className={`${inputClass} font-mono tracking-wider`}
                            placeholder="00:00:00" 
                            maxLength={8}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Velocidad (Opcional)</label>
                        <input 
                            type="number" 
                            step="0.1"
                            value={avgSpeed} 
                            onChange={(e) => setAvgSpeed(e.target.value)}
                            className={inputClass}
                            placeholder="km/h" 
                        />
                    </div>
                </div>
            </div>

            <button 
                disabled={loading || !selectedRiderId}
                className={`w-full font-heading text-xl py-4 rounded-xl transition-all shadow-xl disabled:opacity-50 flex justify-center items-center gap-2 ${
                    isEditing 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30' 
                    : 'bg-[#1A1816] hover:bg-[#C64928] text-white hover:scale-[1.01]'
                }`}
            >
                {loading ? 'Procesando...' : isEditing ? 'GUARDAR CAMBIOS' : 'REGISTRAR RESULTADO'}
            </button>
        </form>
      </div>

      {/* 3. TABLA DE RESULTADOS */}
      <div className="pt-4">
        <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="font-heading text-2xl text-[#1A1816] uppercase">Resultados Guardados</h2>
            <span className="bg-[#EFE6D5] text-[#1A1816] px-3 py-1 rounded-full text-xs font-bold">
                {currentViewResults.length}
            </span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase w-16 text-center">Pos</th>
                            <th className="p-4 text-xs font-bold uppercase">Corredor</th>
                            <th className="p-4 text-xs font-bold uppercase text-right">Puntos</th>
                            <th className="p-4 text-xs font-bold uppercase text-center w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentViewResults.map((res) => {
                            const rider = riders.find(r => r.id === res.rider_id);
                            const isBeingEdited = selectedRiderId === res.rider_id;
                            
                            return (
                                <tr 
                                    key={res.id} 
                                    className={`cursor-pointer transition-colors ${isBeingEdited ? 'bg-amber-50' : 'hover:bg-gray-50'}`}
                                    onClick={() => {
                                        setSelectedRiderId(res.rider_id);
                                        setSearchTerm(rider?.full_name || '');
                                        setIsSearching(false);
                                    }}
                                >
                                    <td className="p-4 font-heading text-2xl text-[#1A1816] text-center">{res.position}º</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 uppercase text-sm">
                                            {rider?.full_name || 'Desconocido'}
                                            {isBeingEdited && <span className="ml-2 text-[9px] text-amber-600 bg-amber-100 px-1 rounded uppercase font-bold">Editando</span>}
                                        </div>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                             {rider?.club || 'Libre'}
                                        </div>
                                    </td>
                                    <td className="p-4 text-right font-heading text-xl text-[#C64928]">{res.points}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleDelete(res.id); }}
                                            className="text-gray-300 hover:text-red-500 p-2"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentViewResults.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-gray-400 italic">Sin resultados</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

    </div>
  );
}