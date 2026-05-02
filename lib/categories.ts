export interface Category {
  id: string;
  label: string;
  group: string;
  description?: string;
}

export const OFFICIAL_CATEGORIES: Category[] = [
  // VARONES
  { id: 'Novicios Varones', label: 'Novicios Varones', group: 'VARONES' },
  { id: 'Elite', label: 'Elite', group: 'VARONES' },
  { id: 'Master A', label: 'Master A', group: 'VARONES' },
  { id: 'Master B', label: 'Master B', group: 'VARONES' },
  { id: 'Master C', label: 'Master C', group: 'VARONES' },
  { id: 'Master D', label: 'Master D', group: 'VARONES' },
  
  // DAMAS
  { id: 'Novicias Damas', label: 'Novicias Damas', group: 'DAMAS' },
  { id: 'Damas Master A', label: 'Damas Master A', group: 'DAMAS' },
  { id: 'Damas Master B', label: 'Damas Master B', group: 'DAMAS' },
  { id: 'Damas Master C', label: 'Damas Master C', group: 'DAMAS' },
  
  // MIXTAS
  { id: 'Pre Master Mixto', label: 'Pre Master Mixto', group: 'MIXTAS' },
  { id: 'Enduro Mixto', label: 'Enduro Mixto', group: 'MIXTAS' },
  { id: 'EBike Mixto', label: 'EBike Mixto', group: 'MIXTAS' },
];

export const CATEGORY_GROUPS = OFFICIAL_CATEGORIES.reduce((acc, cat) => {
  const group = cat.group || 'OTROS';
  if (!acc[group]) acc[group] = [];
  acc[group].push(cat);
  return acc;
}, {} as Record<string, Category[]>);
