'use client';

import { useState, useMemo, useEffect } from 'react';
import { createResult, deleteResult } from '@/actions/results';
import { Event, Rider, RawResult } from '@/lib/definitions';

interface ExtendedRider extends Rider {
  created_at?: string; 
}

interface Props {
  events: Event[];
  riders: ExtendedRider[];
  existingResults: RawResult[];
}

export default function ResultManager({ events, riders, existingResults }: Props) {
  // --- ESTADOS DE CONFIGURACIÓN ---
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  // Iniciamos con una categoría común para que no salga vacío
  const [selectedCategory, setSelectedCategory] = useState<string>('Novicios Open');

  // --- ESTADOS DEL FORMULARIO ---
  const [searchTerm, setSearchTerm] = useState<string>(''); // Buscador
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  
  // Datos Técnicos
  const [raceTime, setRaceTime] = useState<string>('');
  const [avgSpeed, setAvgSpeed] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- 1. FILTRADO INTELIGENTE ---
  const filteredRiders = useMemo(() => {
    // Solo mostramos corredores que pertenezcan a la categoría seleccionada
    let list = riders.filter(r => r.category === selectedCategory);

    if (searchTerm) {
        // MODO BÚSQUEDA: Alfabético (A-Z)
        const term = searchTerm.toLowerCase();
        list = list.filter(r => r.full_name.toLowerCase().includes(term));
        return list.sort((a, b) => a.full_name.localeCompare(b.full_name));
    } else {
        // MODO LISTA: Nuevos Primero (Fecha creación descendente)
        return list.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA; 
        });
    }
  }, [riders, selectedCategory, searchTerm]);

  // --- 2. LISTA DE RESULTADOS YA CARGADOS ---
  const currentViewResults = existingResults.filter(r => 
    r.event_id === selectedEventId && 
    r.category_played === selectedCategory
  ).sort((a, b) => a.position - b.position);

  // --- 3. AUTO-DETECCIÓN DE EDICIÓN ---
  useEffect(() => {
    if (!selectedRiderId || !selectedEventId) {
        resetForm(false);
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
        resetForm(true); 
    }
  }, [selectedRiderId, selectedEventId, existingResults]);

  const resetForm = (keepRider: boolean) => {
      setIsEditing(false);
      setPosition('');
      setPoints('');
      setRaceTime('');
      setAvgSpeed('');
      if (!keepRider) {
          setSelectedRiderId('');
      }
  };

  // --- 4. CALCULADORA DE PUNTOS SEMI-AUTOMÁTICA ---
  const handlePositionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setPosition(val);

      const pos = parseInt(val);
      if (!isNaN(pos) && pos > 0) {
          let calcPoints = 0;
          if (pos <= 10) {
              // 1º = 100, 2º = 90 ... 10º = 10
              calcPoints = 110 - (pos * 10);
          } else if (pos < 20) {
              // 11º = 9 ... 19º = 1
              calcPoints = 20 - pos;
          } else {
              // 20º en adelante = 1 punto
              calcPoints = 1;
          }
          setPoints(calcPoints.toString());
      } else {
          setPoints('');
      }
  };

  // --- 5. FORMATO AUTOMÁTICO DE TIEMPO ---
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    if (raw.length > 6) return; 

    let formatted = raw;
    if (raw.length > 2) formatted = `${raw.slice(0, 2)}:${raw.slice(2)}`;
    if (raw.length > 4) formatted = `${raw.slice(0, 2)}:${raw.slice(2, 4)}:${raw.slice(4)}`;

    setRaceTime(formatted);
  };

  // --- HANDLERS ---
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
      
      resetForm(false); 
      setSearchTerm(''); 

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
    if (isEditing) resetForm(false);
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
                        setSelectedRiderId('');
                        setSearchTerm('');
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
                    
                    {/* AQUÍ ESTÁ LA MAGIA PARA QUE LAS DAMAS SALGAN EN SU RANKING */}
                    <optgroup label="Damas" className="bg-white text-black">
                        <option value="Novicias Open">Novicias Open</option>
                        {/* Fíjate en el 'value', dice Damas Pre Master para diferenciarse de los hombres */}
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
      <div className={`p-6 md:p-8 rounded-3xl shadow-lg border relative overflow-hidden transition-colors duration-500 ${
          isEditing ? 'bg-amber-50 border-amber-300' : 'bg-white border-gray-200'
      }`}>
        <div className={`absolute top-0 left-0 w-2 h-full ${isEditing ? 'bg-amber-400' : 'bg-gray-200'}`}></div>
        
        <div className="flex justify-between items-center mb-6 pl-4">
            <h2 className="font-heading text-2xl text-[#1A1816] uppercase">
                {isEditing ? (
                    <span className="text-amber-600 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editando
                    </span>
                ) : (
                    <span>2. Ingresar Datos</span>
                )}
            </h2>
            {isEditing && (
                <span className="text-[10px] font-bold uppercase bg-amber-200 text-amber-800 px-2 py-1 rounded border border-amber-300">Modo Edición</span>
            )}
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6 pl-4">
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* COLUMNA 1: SELECCIÓN DE CORREDOR */}
                <div className="md:col-span-1 space-y-2">
                    <label className={labelClass}>
                        Corredor <span className="text-gray-400 font-normal ml-1">({filteredRiders.length})</span>
                    </label>
                    
                    {/* Buscador */}
                    <div className="relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setSelectedRiderId(''); 
                            }}
                            placeholder="🔍 Buscar nombre..."
                            className="w-full p-2 text-sm border border-gray-300 rounded-t-lg bg-gray-50 focus:bg-white focus:outline-none focus:border-[#C64928]"
                        />
                    </div>

                    {/* Selector */}
                    <select 
                        value={selectedRiderId} 
                        onChange={(e) => setSelectedRiderId(e.target.value)}
                        className={`${inputClass} rounded-t-none border-t-0 mt-0`} 
                        required
                        size={filteredRiders.length > 5 ? 5 : 0} 
                    >
                        <option value="" className="text-gray-400">
                            {searchTerm && filteredRiders.length === 0 ? '(No encontrado)' : '-- Seleccionar --'}
                        </option>
                        {filteredRiders.map(r => (
                            <option key={r.id} value={r.id} className="py-1">
                                {r.full_name} {isEditing && r.id === selectedRiderId ? '📝' : ''}
                            </option>
                        ))}
                    </select>
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
                    
                    {/* DATOS TÉCNICOS OPCIONALES */}
                    <div>
                        <label className={labelClass}>
                            Tiempo (Auto) <span className="text-gray-400 font-normal lowercase tracking-normal ml-1">(opcional)</span>
                        </label>
                        <input 
                            type="text" 
                            value={raceTime} 
                            onChange={handleTimeChange} 
                            className={`${inputClass} font-mono tracking-wider`}
                            placeholder="Ej: 01:30:15" 
                            maxLength={8}
                        />
                        <span className="text-[9px] text-gray-400">Escribe: 013015</span>
                    </div>
                    <div>
                        <label className={labelClass}>
                            Velocidad <span className="text-gray-400 font-normal lowercase tracking-normal ml-1">(opcional)</span>
                        </label>
                        <div className="relative">
                            <input 
                                type="number" 
                                step="0.1"
                                value={avgSpeed} 
                                onChange={(e) => setAvgSpeed(e.target.value)}
                                className={`${inputClass} pr-8`}
                                placeholder="24.5" 
                            />
                            <span className="absolute right-3 top-3 text-gray-400 text-xs font-bold">km/h</span>
                        </div>
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
            <h2 className="font-heading text-2xl text-[#1A1816] uppercase">Resultados en {selectedCategory}</h2>
            <span className="bg-[#EFE6D5] text-[#1A1816] px-3 py-1 rounded-full text-xs font-bold border border-[#1A1816]/10">
                {currentViewResults.length} Registros
            </span>
        </div>
        
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                        <tr>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider w-16 text-center">Pos</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider">Corredor</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-right">Puntos</th>
                            <th className="p-4 text-xs font-bold uppercase tracking-wider text-center w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {currentViewResults.map((res) => {
                            const riderName = riders.find(r => r.id === res.rider_id)?.full_name || 'Desconocido';
                            const isBeingEdited = res.rider_id === selectedRiderId;

                            return (
                                <tr 
                                    key={res.id} 
                                    className={`transition-colors group cursor-pointer ${
                                        isBeingEdited ? 'bg-amber-50 border-l-4 border-amber-500' : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                        setSelectedRiderId(res.rider_id);
                                    }}
                                    title="Click para editar"
                                >
                                    <td className="p-4 font-heading text-2xl text-[#1A1816] text-center">{res.position}º</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 uppercase text-sm">
                                            {riderName} 
                                            {isBeingEdited && <span className="text-[10px] text-amber-600 ml-2 bg-amber-100 px-1 rounded">EDITANDO</span>}
                                        </div>
                                        {(res.race_time || res.avg_speed) && (
                                            <div className="flex gap-3 mt-1 text-[10px] text-gray-400 font-mono">
                                                {res.race_time && <span className="flex items-center gap-1">⏱ {res.race_time}</span>}
                                                {res.avg_speed && <span className="flex items-center gap-1">⚡ {res.avg_speed}</span>}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-4 text-right font-heading text-xl text-[#C64928]">{res.points}</td>
                                    <td className="p-4 text-center">
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(res.id);
                                            }}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                            title="Eliminar registro"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                        
                        {currentViewResults.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-12 text-center text-gray-400">
                                    <p className="font-heading text-xl opacity-50 uppercase">No hay resultados cargados</p>
                                </td>
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