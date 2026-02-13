export type Rider = {
  id: string;
  full_name: string;
  club: string | null;
  category: string;
  
  // --- CAMPOS GEOGRÁFICOS Y LEGALES ---
  ciudad: string | null;
  rut: string | null;
  
  // --- CAMPOS DE CONTACTO (Nuevos) ---
  email: string | null;
  phone: string | null;
  
  // --- PERFIL ---
  birth_date: string | null;
  instagram: string | null;
  
  // --- IMÁGENES Y SPONSORS (Opcionales) ---
  club_logo: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  sponsor_3: string | null;
  
  created_at?: string;
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
export type RankingDisplayData = {
  rider_id: string;
  full_name: string;
  category_shown: string;
  club: string | null;
  points_display: number;
  stats_extra: string | null;

  city: string | null;
  club_logo: string | null;
  instagram: string | null;
  sponsors: string[];
  race_time?: string | null;
  avg_speed?: number | null;
};