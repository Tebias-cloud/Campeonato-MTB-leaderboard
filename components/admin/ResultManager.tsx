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
  // --- ESTADOS DE CONFIGURACIÓN ---
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || '');
  const [selectedCategory, setSelectedCategory] = useState<string>('Novicios Open');

  // --- ESTADOS DEL FORMULARIO ---
  const [selectedRiderId, setSelectedRiderId] = useState<string>('');
  
  // Estados para el Buscador Visual
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const searchContainerRef = useRef<HTMLDivElement>(null); // Referencia para detectar clics fuera
  
  const [position, setPosition] = useState<string>('');
  const [points, setPoints] = useState<string>('');
  
  // Datos Técnicos
  const [raceTime, setRaceTime] = useState<string>('');
  const [avgSpeed, setAvgSpeed] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- 1. FILTRADO PARA EL BUSCADOR ---
  const filteredRiders = useMemo(() => {
    // 1. Base: Solo los de la categoría seleccionada
    const candidates = riders.filter(r => r.category === selectedCategory);

    // 2. Si NO hay búsqueda, devolvemos TODOS los candidatos (ordenados alfabéticamente)
    if (!searchTerm) {
        return candidates.sort((a, b) => a.full_name.localeCompare(b.full_name));
    }

    // 3. Si HAY búsqueda, filtramos esa lista
    const term = searchTerm.toLowerCase();
    return candidates.filter(r => 
        r.full_name.toLowerCase().includes(term) || 
        (r.rut && r.rut.toLowerCase().includes(term)) ||
        (r.club && r.club.toLowerCase().includes(term))
    ).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [riders, selectedCategory, searchTerm]);


  // --- 2. LISTA DE RESULTADOS YA CARGADOS (TABLA INFERIOR) ---
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
        
        // Llenamos el buscador con el nombre para que se vea bonito
        const currentRider = riders.find(r => r.id === selectedRiderId);
        if (currentRider) setSearchTerm(currentRider.full_name);

    } else {
        resetForm(true); 
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRiderId, selectedEventId, existingResults]);

  // Cierra el menú si haces clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearching(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = (keepRider: boolean) => {
      setIsEditing(false);
      setPosition('');
      setPoints('');
      setRaceTime('');
      setAvgSpeed('');
      if (!keepRider) {
          setSelectedRiderId('');
          setSearchTerm(''); 
      }
  };

  // --- 4. SELECCIONAR UN RIDER DESDE LA LISTA ---
  const handleSelectRider = (rider: Rider) => {
      setSelectedRiderId(rider.id);
      setSearchTerm(rider.full_name); 
      setIsSearching(false); 
  };

  // --- 5. CALCULADORA DE PUNTOS ---
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

  // --- 6. FORMATO TIEMPO ---
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
        {/* Indicador visual de modo edición */}
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
                
                {/* --- SELECCIONADOR HÍBRIDO (BUSCADOR + LISTA) --- */}
                <div className="md:col-span-1 relative z-50" ref={searchContainerRef}>
                    <label className={labelClass}>
                        Seleccionar Corredor <span className="text-gray-400 font-normal">({filteredRiders.length})</span>
                    </label>
                    
                    {/* Input que actúa como Buscador y Activador de Lista */}
                    <div className="relative">
                        <input 
                            type="text"
                            value={searchTerm}
                            onClick={() => setIsSearching(true)} // Al hacer click, abre la lista completa
                            onFocus={() => setIsSearching(true)} // Al enfocar, también
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setIsSearching(true);
                                if(e.target.value === '') setSelectedRiderId('');
                            }}
                            placeholder="Seleccionar o buscar..."
                            className={`w-full p-3 pl-10 bg-white border cursor-pointer ${selectedRiderId ? 'border-green-500 bg-green-50 font-bold' : 'border-gray-300'} rounded-xl focus:outline-none focus:border-[#C64928] focus:ring-2 focus:ring-[#C64928]/20 transition-all`}
                        />
                        <div className="absolute left-3 top-3.5 text-gray-400">
                             {selectedRiderId ? '✅' : '🔻'}
                        </div>
                    </div>

                    {/* Lista Desplegable (Siempre muestra datos si está abierto) */}
                    {isSearching && (
                        <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-60 overflow-y-auto">
                            {filteredRiders.length > 0 ? (
                                filteredRiders.map(r => (
                                    <div 
                                        key={r.id}
                                        onClick={() => handleSelectRider(r)}
                                        className={`p-3 cursor-pointer border-b border-gray-50 transition-colors group ${
                                            r.id === selectedRiderId ? 'bg-amber-50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="font-bold text-[#1A1816] group-hover:text-[#C64928]">
                                            {r.full_name}
                                        </div>
                                        <div className="text-[10px] text-gray-400 flex flex-wrap gap-2">
                                            <span className="font-bold text-gray-500">{r.club || 'Sin Club'}</span>
                                            {r.rut && <span>• {r.rut}</span>}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-gray-400 text-sm italic">
                                    No hay corredores en esta categoría con ese nombre.
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
                            return (
                                <tr 
                                    key={res.id} 
                                    className={`cursor-pointer hover:bg-gray-50 transition-colors ${selectedRiderId === res.rider_id ? 'bg-amber-50' : ''}`}
                                    onClick={() => {
                                        setSelectedRiderId(res.rider_id);
                                        setSearchTerm(rider?.full_name || ''); // Llenar el buscador al editar
                                    }}
                                >
                                    <td className="p-4 font-heading text-2xl text-[#1A1816] text-center">{res.position}º</td>
                                    <td className="p-4">
                                        <div className="font-bold text-gray-800 uppercase text-sm">
                                            {rider?.full_name || 'Desconocido'}
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
                                            🗑️
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