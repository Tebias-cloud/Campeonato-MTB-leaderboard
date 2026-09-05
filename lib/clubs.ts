const COMMON_WORDS = new Set(['CLUB', 'TEAM', 'BIKE', 'MTB', 'RACING', 'CICLISMO', 'DEPORTIVO']);

export function normalizeClubName(name: string): string {
  if (!name) return 'INDEPENDIENTE / LIBRE';
  let cleaned = name.toUpperCase().trim();
  
  // Remove accents
  cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Remove multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  if (cleaned === '' || cleaned === 'INDEPENDIENTE' || cleaned === 'SIN CLUB' || cleaned === 'NINGUNO') {
    return 'INDEPENDIENTE / LIBRE';
  }
  
  return cleaned;
}

// Simple Jaccard similarity for words, or string distance
export function getClubSimilarity(a: string, b: string): number {
  const normA = normalizeClubName(a).replace(/[^A-Z0-9 ]/g, '');
  const normB = normalizeClubName(b).replace(/[^A-Z0-9 ]/g, '');
  
  if (normA === normB) return 1;
  
  // If one string without spaces is a substring of another without spaces
  const noSpaceA = normA.replace(/\s+/g, '');
  const noSpaceB = normB.replace(/\s+/g, '');
  if (noSpaceA === noSpaceB) return 0.9;
  
  const wordsA = normA.split(' ').filter(w => w.length > 0);
  const wordsB = normB.split(' ').filter(w => w.length > 0);
  
  // Remove common words to calculate score based on unique identifying words
  const uniqueWordsA = new Set(wordsA.filter(w => !COMMON_WORDS.has(w)));
  const uniqueWordsB = new Set(wordsB.filter(w => !COMMON_WORDS.has(w)));
  
  const setA = uniqueWordsA.size > 0 ? uniqueWordsA : new Set(wordsA);
  const setB = uniqueWordsB.size > 0 ? uniqueWordsB : new Set(wordsB);
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / (union.size || 1);
}

export function getClubSuggestions(input: string, existingClubs: string[]): string[] {
  const normalizedInput = normalizeClubName(input);
  if (normalizedInput === 'INDEPENDIENTE / LIBRE') return [];

  const scored = existingClubs
    .map(club => ({ club, score: getClubSimilarity(input, club) }))
    .filter(c => c.score > 0.6) // threshold conservador
    .sort((a, b) => b.score - a.score);
    
  return scored.slice(0, 3).map(c => c.club);
}
