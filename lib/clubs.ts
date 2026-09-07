const COMMON_WORDS = new Set(['CLUB', 'TEAM', 'BIKE', 'MTB', 'RACING', 'CICLISMO', 'DEPORTIVO']);
const STOP_WORDS = new Set(['DE', 'DEL', 'LOS', 'LAS', 'EL', 'LA', 'Y', 'E']);

export const ORGANIZER_CLUBS = [
  'TEAM CYCLES FRANKLIN',
  'CHASKI RIDERS',
  'CLUB TMT',
  'COBRALINCH MTB',
  'CONDORES B&T',
  'IQUIQUE BIKE',
  'CLUB CAMANCHACA'
];

export function normalizeClubName(name: string): string {
  if (!name) return 'INDEPENDIENTE / LIBRE';
  let cleaned = name.toUpperCase().trim();
  
  // Remove accents
  cleaned = cleaned.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  // Clean special characters
  cleaned = cleaned.replace(/[^A-Z0-9 ]/g, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  if (cleaned === '' || cleaned === 'INDEPENDIENTE' || cleaned === 'SIN CLUB' || cleaned === 'NINGUNO') {
    return 'INDEPENDIENTE / LIBRE';
  }
  
  return cleaned;
}

// Damerau-Levenshtein distance (handles insertions, deletions, substitutions, and transpositions)
function damerauLevenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,        // deletion
        dp[i][j - 1] + 1,        // insertion
        dp[i - 1][j - 1] + cost  // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1); // transposition
      }
    }
  }
  return dp[m][n];
}

function wordScore(inWord: string, cWord: string): number {
  if (inWord === cWord) {
    if (STOP_WORDS.has(cWord)) return 0.50;
    if (COMMON_WORDS.has(cWord)) return 0.70;
    return 1.0;
  }

  // Prefix match on meaningful word: e.g. "fra" -> "franklin", "cam" -> "camanchaca", "del" -> "delfin"
  if (cWord.startsWith(inWord) && inWord.length >= 3) {
    if (STOP_WORDS.has(cWord)) return 0.40;
    if (COMMON_WORDS.has(cWord)) return 0.75;
    return 0.95;
  }

  // Typo tolerance with Damerau-Levenshtein
  const maxLen = Math.max(inWord.length, cWord.length);
  const dist = damerauLevenshtein(inWord, cWord);
  
  if (dist === 1 && maxLen >= 4) {
    if (STOP_WORDS.has(cWord)) return 0.40;
    if (COMMON_WORDS.has(cWord)) return 0.75;
    return 0.88;
  }
  if (dist === 2 && maxLen >= 6) {
    return 0.75;
  }

  return 0;
}

export function getClubSimilarity(input: string, club: string): number {
  const normInput = normalizeClubName(input);
  const normClub = normalizeClubName(club);

  if (normInput === normClub) return 1.0;
  if (normInput === 'INDEPENDIENTE / LIBRE') return 0;

  const inputWords = normInput.split(' ').filter(w => w.length > 0);
  const clubWords = normClub.split(' ').filter(w => w.length > 0);

  // Single word input
  if (inputWords.length === 1) {
    const singleWord = inputWords[0];
    let maxSingle = 0;
    for (const cWord of clubWords) {
      if (cWord === singleWord) {
        if (!STOP_WORDS.has(cWord)) return 0.99;
      }
      if (cWord.startsWith(singleWord) && singleWord.length >= 3) {
        if (!STOP_WORDS.has(cWord)) {
          const isCommon = COMMON_WORDS.has(cWord);
          const score = isCommon ? 0.75 : 0.95;
          if (score > maxSingle) maxSingle = score;
        }
      }
      if (singleWord.length >= 4 && damerauLevenshtein(singleWord, cWord) <= 1) {
        const score = COMMON_WORDS.has(cWord) ? 0.75 : 0.90;
        if (score > maxSingle) maxSingle = score;
      }
    }
    if (maxSingle > 0) return maxSingle;
  }

  // Multi-word input
  let totalScore = 0;
  let matchesCount = 0;

  for (const inWord of inputWords) {
    let best = 0;
    for (const cWord of clubWords) {
      const s = wordScore(inWord, cWord);
      if (s > best) best = s;
    }
    if (best >= 0.70) {
      matchesCount++;
      const isCommon = COMMON_WORDS.has(inWord) || STOP_WORDS.has(inWord);
      totalScore += isCommon ? best * 0.5 : best * 1.0;
    }
  }

  if (matchesCount === 0) return 0;

  const uniqueInWords = inputWords.filter(w => !COMMON_WORDS.has(w) && !STOP_WORDS.has(w));
  const divisor = uniqueInWords.length > 0 ? uniqueInWords.length : inputWords.length;
  const score = totalScore / divisor;

  return Math.min(score, 0.95);
}

export function getClubSuggestions(input: string, existingClubs: string[]): string[] {
  const normalizedInput = normalizeClubName(input);
  if (normalizedInput === 'INDEPENDIENTE / LIBRE' || normalizedInput.length < 2) return [];

  const scored = existingClubs
    .map(club => ({ club, score: getClubSimilarity(input, club) }))
    .filter(c => c.score >= 0.75)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.club.length - b.club.length;
    });

  return scored.slice(0, 3).map(c => c.club);
}

export function getInitialClubList(existingClubs: string[], maxOptions: number = 8): string[] {
  const result: string[] = ['INDEPENDIENTE / LIBRE'];

  // 1. Prioritise organizer clubs
  for (const org of ORGANIZER_CLUBS) {
    const found = existingClubs.find(c => c.toUpperCase() === org.toUpperCase());
    if (found && !result.includes(found)) {
      result.push(found);
      if (result.length >= maxOptions) return result;
    }
  }

  // 2. Complete with most used clubs
  for (const c of existingClubs) {
    if (c !== 'INDEPENDIENTE / LIBRE' && !result.includes(c)) {
      result.push(c);
      if (result.length >= maxOptions) break;
    }
  }

  return result.slice(0, maxOptions);
}
