/**
 * Unifica las categorías del campeonato para visualización en el admin y ranking.
 * Ejemplo: "Novicios Open (Recién empezando)" -> "Novicios Open"
 */
export const normalizeCategory = (cat: string | null | undefined): string => {
  if (!cat) return 'Sin Categoría';
  
  const clean = cat.split('(')[0].trim();

  // Mapeos de compatibilidad con nombres viejos o variaciones
  if (clean.includes('Novicios Open') || clean.includes('Novicios Varones')) return 'Novicios Varones';
  if (clean.includes('Novicias Open') || clean.includes('Novicias Damas')) return 'Novicias Damas';
  if (clean.includes('Pre Master')) return 'Pre Master Mixto';
  if (clean.includes('Enduro')) return 'Enduro Mixto';
  if (clean.includes('E-Bike') || clean.includes('EBike')) return 'EBike Mixto';
  
  return clean;
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
