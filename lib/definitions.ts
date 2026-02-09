export type Rider = {
  id: string;
  full_name: string;
  club: string | null;
  category: string; 
  region: string | null;
  birth_date: string | null;
  instagram: string | null;
  club_logo: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  sponsor_3: string | null;
};

export type Event = {
  id: string;
  name: string;
  date: string;
  status: string;
};

// AQUÍ AGREGUÉ LOS NUEVOS CAMPOS
export type RawResult = {
  id: string;
  event_id: string;
  rider_id: string;
  category_played: string;
  position: number;
  points: number;
  created_at: string;
  // --- Nuevos datos técnicos ---
  race_time?: string | null; 
  avg_speed?: number | null;
};

// Tipos para el Ranking
export type RankingDisplayData = {
  rider_id: string;
  full_name: string;
  category_shown: string;
  club: string | null;
  points_display: number;
  stats_extra: string | null;
};