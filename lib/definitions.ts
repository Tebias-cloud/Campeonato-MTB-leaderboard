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
    "Novicios Varones",
    "Pre Master",
    "Master A",
    "Master B",
    "Master C",
    "Master D",
    "Elite"
  ],
  "Damas": [
    "Novicias Damas",
    "Damas Pre Master",
    "Damas Master A",
    "Damas Master B",
    "Damas Master C"
  ],
  "Mixtas": [
    "Enduro Mixto",
    "EBike Mixto"
  ]
};

export const OFFICIAL_CATEGORIES = Object.values(CATEGORY_GROUPS).flat();