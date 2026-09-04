// lib/results-parser.ts

// Regex unificado para capturar puestos, dorsales, nombres (incluso con números, apóstrofes o paréntesis) y tiempos o DNF/DNS/DQ
export const RIDER_REGEX = /(?:^|\s)(?:(\d+)\s+)?(\d+)\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ][A-ZÁÉÍÓÚÑÜÄËÏÖ0-9\s()\.#&'’/\-]*?)\s+(\d{1,2}:[\d:.]+|DQ|DNF|DNS|DSQ|NC)/gi;

export function parseRiderLine(line: string) {
  const matches = Array.from(line.matchAll(RIDER_REGEX));
  if (matches.length === 0) return [];
  
  return matches.map(match => {
    const time = match[4].toUpperCase();
    const isDQ = ["DQ", "DNF", "DNS", "DSQ", "NC"].includes(time);
    const position = match[1] ? parseInt(match[1]) : (isDQ ? 999 : -1);
    
    return {
      position,
      dorsal: parseInt(match[2]),
      riderName: match[3].trim(),
      time,
      isDQ,
      originalText: match[0].trim()
    };
  });
}
