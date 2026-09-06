import { OFFICIAL_CATEGORIES } from './categories';

/**
 * Unifica las categorías del campeonato para visualización en el admin y ranking.
 * Ejemplo: "Novicios Open (Recién empezando)" -> "Novicios Open"
 */
export const normalizeCategory = (cat: string | null | undefined): string => {
  if (!cat) return 'Desconocida';
  
  // Limpieza inicial: quitar paréntesis, quitar acentos y pasar a mayúsculas
  let upper = cat.toUpperCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // quita tildes
    .replace(/\(.*?\)/g, '') // quita rangos de edad en paréntesis ej. (30 A 39 AÑOS)
    .replace(/-/g, ' ')      // E-BIKE -> E BIKE
    .trim()
    .replace(/\s+/g, ' ');   // espacios dobles a simples

  // Si coincide exactamente con el label (ignorando mayúsculas/tildes)
  const official = OFFICIAL_CATEGORIES.find(
    c => c.label.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "") === upper
  );
  if (official) return official.label;

  // Mapeos robustos tolerantes a prefijos y sufijos comunes
  
  // 1. NOVICIOS / NOVICIAS
  if (upper.includes('NOVICIA')) return 'Novicias Damas'; // cubre NOVICIAS OPEN, NOVICIAS DAMAS
  if (upper.includes('NOVICIO')) return 'Novicios Varones'; // cubre NOVICIOS OPEN, NOVICIOS VARONES, NOVICIOS

  // 2. MIXTOS (EBIKE, PRE MASTER, ENDURO)
  if (upper.includes('EBIKE') || upper.includes('E BIKE')) return 'EBike Mixto';
  if (upper.includes('PREMASTER') || upper.includes('PRE MASTER')) return 'Pre Master Mixto';
  if (upper.includes('ENDURO')) return 'Enduro Mixto';

  // 3. MASTER (Validar si incluye DAMAS explícitamente)
  const isDamas = upper.includes('DAMA');
  
  if (upper.includes('MASTER A')) return isDamas ? 'Damas Master A' : 'Master A';
  if (upper.includes('MASTER B')) return isDamas ? 'Damas Master B' : 'Master B';
  if (upper.includes('MASTER C')) return isDamas ? 'Damas Master C' : 'Master C';
  if (upper.includes('MASTER D')) return 'Master D'; // Master D no tiene versión damas en la lista oficial

  // 4. ELITE
  if (upper.includes('ELITE')) return 'Elite';

  // Si nada de lo anterior matchea, no inventamos variantes.
  return 'Desconocida';
};

/**
 * Normaliza teléfonos al formato chileno: +56 9 XXXX XXXX
 */
export const formatChileanPhone = (phone: string | null | undefined): string => {
  if (!phone) return '';
  
  // 1. Limpiar todo lo que no sea número
  let clean = phone.replace(/\D/g, '');
  
  // 2. Manejar prefijos
  if (clean.length === 8) {
    // Si solo tiene 8 dígitos (ej: 12345678), asumimos que falta el 9 y el 56
    clean = '569' + clean;
  } else if (clean.length === 9) {
    // Si tiene 9 dígitos (ej: 912345678), falta el 56
    clean = '56' + clean;
  } else if (clean.startsWith('0')) {
    // Si empieza por 0, quitarlo y re-procesar
    return formatChileanPhone(clean.slice(1));
  }
  
  // 3. Si no tiene el largo esperado (11 dígitos para +569...), devolver limpio pero sin formato
  if (clean.length !== 11) return clean ? `+${clean}` : '';
  
  // 4. Aplicar formato: +56 9 1234 5678
  const country = clean.slice(0, 2);
  const prefix = clean.slice(2, 3);
  const part1 = clean.slice(3, 7);
  const part2 = clean.slice(7, 11);
  
  return `+${country} ${prefix} ${part1} ${part2}`;
};

export const cleanInstagramHandle = (input: string | null | undefined): string | null => {
  if (!input) return null;
  let handle = input.trim();
  
  // Si es una URL completa
  if (handle.includes('instagram.com/')) {
    // Tomar la parte después de instagram.com/
    const parts = handle.split('instagram.com/');
    const lastPart = parts[parts.length - 1];
    // Quitar parámetros (query strings) como ?igsh=...
    handle = lastPart.split('?')[0];
  }
  
  // Quitar slash final si existe
  if (handle.endsWith('/')) {
    handle = handle.slice(0, -1);
  }
  
  // Si después de todo queda algo como "reels/handle", intentar sacar solo el final
  const segments = handle.split('/');
  handle = segments[segments.length - 1];
  
  // Quitar el @ si lo pusieron al principio
  if (handle.startsWith('@')) {
    handle = handle.slice(1);
  }
  
  return handle || null;
};

export const normalizeForMatch = (str: string | null | undefined) => {
  if (!str) return [];
  const noClub = str.split('(')[0];
  const cleaned = noClub.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9\s]/g, '');
  return cleaned.split(/\s+/).filter(t => t.length > 0);
};

export const isNameCompatible = (nameA: string | null | undefined, nameB: string | null | undefined) => {
  const tokensA = normalizeForMatch(nameA);
  const tokensB = normalizeForMatch(nameB);

  if (tokensA.length === 0 || tokensB.length === 0) return false;

  const shorter = tokensA.length <= tokensB.length ? tokensA : tokensB;
  const longer = tokensA.length <= tokensB.length ? tokensB : tokensA;

  let longerIndex = 0;
  for (let i = 0; i < shorter.length; i++) {
    const tokenToFind = shorter[i];
    let found = false;
    for (let j = longerIndex; j < longer.length; j++) {
      if (longer[j] === tokenToFind) {
        found = true;
        longerIndex = j + 1;
        break;
      }
    }
    if (!found) return false;
  }

  return true;
};
