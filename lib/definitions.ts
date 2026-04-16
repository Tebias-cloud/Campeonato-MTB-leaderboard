// lib/definitions.ts

export interface FormField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  fullWidth?: boolean;
}

export type Event = {
  id: string;
  name: string;
  subtitle?: string;
  description?: string;
  date: string;
  status: string;
  price?: string;
  bank_owner?: string;
  bank_rut?: string;
  bank_name?: string;
  bank_account?: string;
  terms_conditions?: string;
  form_config: {
    fields: FormField[];
    categories: string[];
  };
};

export type Rider = {
  id: string;
  full_name: string;
  club: string | null;
  category: string;
  ciudad: string | null;
  rut: string | null;
  email: string | null;
  phone: string | null;
  birth_date: string | null;
  instagram: string | null;
  club_logo: string | null;
  sponsor_1: string | null;
  sponsor_2: string | null;
  sponsor_3: string | null;
  created_at?: string;
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

// CATEGORÍAS GLOBALES CENTRALIZADAS
export const CATEGORY_GROUPS = {
  "Varones": [
    "Novicios Open (Recién empezando)",
    "Pre Master (16 a 29 Años)",
    "Master A (30 a 39 Años)",
    "Master B (40 a 49 Años)",
    "Master C (50 a 59 Años)",
    "Master D (60 Años y Más)",
    "Elite Open"
  ],
  "Damas": [
    "Novicias Open (Recién empezando)",
    "Damas Pre Master (15 a 29 Años)",
    "Damas Master A (30 a 39 Años)",
    "Damas Master B (40 a 49 Años)",
    "Damas Master C (50 Años y más)"
  ],
  "Mixtas": [
    "Enduro Mixto Open",
    "EBike Mixto Open"
  ]
};

export const OFFICIAL_CATEGORIES = Object.values(CATEGORY_GROUPS).flat();