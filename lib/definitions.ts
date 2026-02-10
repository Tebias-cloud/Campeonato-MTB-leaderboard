export type Rider = {
  id: string;
  full_name: string;
  club: string | null;
  category: string;
  // region: string | null; // Ya no usamos región, usamos ciudad
  ciudad: string | null;    // <--- IMPORTANTE: Nuevo campo
  rut: string | null;       // <--- IMPORTANTE: Nuevo campo
  birth_date: string | null;
  instagram: string | null;
  club_logo: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  sponsor_3: string | null;
  created_at?: string;      // Útil para ordenar por antigüedad
};

export type Event = {
  id: string;
  name: string;
  date: string;
  status: string;
};

export type RawResult = {
  id: string;
  event_id: string;
  rider_id: string;
  category_played: string;
  position: number;
  points: number;
  created_at: string;
  race_time?: string | null;
  avg_speed?: number | null;
};

// --- TIPO ACTUALIZADO PARA EL RANKING ---
// Esto es lo que usa tu página /ranking para mostrar las tarjetas bonitas
export type RankingDisplayData = {
  rider_id: string;
  full_name: string;
  category_shown: string;
  club: string | null;
  points_display: number;
  stats_extra: string | null; // Ej: "3 Carreras"

  // --- LO QUE FALTABA ---
  city: string | null;         // Para mostrar la ciudad en celular
  club_logo: string | null;    // Para mostrar el logo del equipo
  instagram: string | null;    // Para el link al perfil
  sponsors: string[];          // Array con los sponsors válidos
  race_time?: string | null;   // Solo para ranking de fecha específica
  avg_speed?: number | null;   // Solo para ranking de fecha específica
};