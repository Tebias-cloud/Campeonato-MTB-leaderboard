const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const { createClient } = require('@supabase/supabase-js');

const CATEGORY_KEYWORDS = ['MASTER', 'ELITE', 'NOVICIO', 'DAMAS', 'VARONES', 'MIXTO', 'PRO', 'INFANTIL', 'JUVENIL', 'CADETE', 'SUB', 'EBIKE', 'ENDURO'];
const RIDER_REGEX = /(?:^|\s)(?:(\d+)\s+)?(\d+)\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ][A-ZÁÉÍÓÚÑÜÄËÏÖ0-9\s()\.#&'’/\-]*?)\s+(\d{1,2}:[\d:.]+|DQ|DNF|DNS|DSQ|NC)/gi;

function parseResultsText(fullText, fallbackCategory = 'DESCONOCIDA') {
  if (!fullText || !fullText.trim()) return [];
  const categoryMarkers = [];
  const pdfCatRegex = /([A-ZÁÉÍÓÚÑÜÄËÏÖ\s-]{3,40}?)\s+PUESTO\s+DORSAL\s+NOMBRE\s+TIEMPO/gi;
  for (const match of fullText.matchAll(pdfCatRegex)) {
    let rawCat = match[1].trim().toUpperCase();
    rawCat = rawCat.replace(/.*?\b(RESULTADOS|GENERALES|PAGINA|\d+\/\d+)\s*/i, '').trim();
    rawCat = rawCat.replace(/^(DQ|DNF|DNS|DSQ|NC)\s+/i, '').trim();
    rawCat = rawCat.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|FECHA)\s*[:\-]?\s*/i, '').trim();
    if (CATEGORY_KEYWORDS.some(kw => rawCat.includes(kw))) {
      if (rawCat.includes('PRE MASTER') || rawCat.includes('PREMASTER')) rawCat = 'PRE MASTER MIXTO';
      categoryMarkers.push({ index: match.index, category: rawCat });
    }
  }

  const excelCatRegex = /CATEGOR[IÍ]A\s*:\s*([^\r\n]+)/gi;
  for (const match of fullText.matchAll(excelCatRegex)) {
    let rawCat = match[1].trim().toUpperCase();
    if (rawCat.includes('PRE MASTER') || rawCat.includes('PREMASTER')) rawCat = 'PRE MASTER MIXTO';
    categoryMarkers.push({ index: match.index, category: rawCat });
  }

  const lines = fullText.split(/\r?\n/);
  let charPos = 0;
  for (const line of lines) {
    const cleanLine = line.trim();
    const upper = cleanLine.toUpperCase();
    const isNoise = upper.includes('PUESTO') || upper.includes('DORSAL') || upper.includes('PAGINA') || upper.includes('RESULTADOS') || upper.includes('OFICIAL') || upper.includes('TIEMPO');
    if (CATEGORY_KEYWORDS.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/)) {
      let detected = upper.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|RESULTADOS|FECHA)\s*[:\-]?\s*/i, '').trim();
      if (detected.includes('PRE MASTER') || detected.includes('PREMASTER')) detected = 'PRE MASTER MIXTO';
      categoryMarkers.push({ index: charPos, category: detected });
    }
    charPos += line.length + 1;
  }
  categoryMarkers.sort((a, b) => a.index - b.index);

  const results = [];
  for (const match of fullText.matchAll(RIDER_REGEX)) {
    const idx = match.index;
    const dorsal = match[2];
    const time = match[4].toUpperCase();
    const isDQ = ['DQ', 'DNF', 'DNS', 'DSQ', 'NC'].includes(time);
    const position = match[1] ? parseInt(match[1]) : (isDQ ? 999 : -1);
    const riderName = match[3].trim();
    if (dorsal.length === 4 && dorsal.startsWith('20')) continue;
    if (match[0].toUpperCase().includes('PUESTO') || match[0].toUpperCase().includes('DORSAL')) continue;
    let activeCat = fallbackCategory;
    for (const cm of categoryMarkers) {
      if (cm.index <= idx) activeCat = cm.category;
      else break;
    }
    results.push({
      position,
      dorsal: parseInt(dorsal),
      riderName,
      time,
      isDQ,
      category: activeCat,
      originalText: match[0].trim()
    });
  }
  return results;
}

const getRiderName = (er) => {
  if (!er?.riders) return null;
  if (Array.isArray(er.riders)) return er.riders[0]?.full_name;
  return er.riders.full_name;
};

const normalizeForMatch = (str) => {
  if (!str) return [];
  const noClub = str.split('(')[0];
  const cleaned = noClub.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Z0-9\s]/g, '');
  return cleaned.split(/\s+/).filter(t => t.length > 0);
};

const isNameCompatible = (nameA, nameB) => {
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

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) acc[m[1]] = m[2].trim();
    return acc;
  }, {});
  
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const event3Id = '2649e7c5-3479-4362-a35a-33aa060976cc';
  
  const { data: riders } = await supabase.from('riders').select('*');
  const { data: eventRiders } = await supabase.from('event_riders').select('*, riders!rider_id(full_name, rut, club, category)').eq('event_id', event3Id);
  const { data: allEventRiders } = await supabase.from('event_riders').select('*');
  const { data: allResults } = await supabase.from('results').select('*');
  const { data: events } = await supabase.from('events').select('*');

  const data = new Uint8Array(fs.readFileSync('C:/Users/esteb/Downloads/Results.pdf'));
  const loadingTask = pdfjsLib.getDocument({ data });
  const pdf = await loadingTask.promise;
  
  let fullText = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    fullText += textContent.items.map((item) => item.str).join(" ") + "\\n";
  }

  const parsedRiders = parseResultsText(fullText, "DESCONOCIDA");
  let dqs = 0;
  
  const suspects = [];

  for (const item of parsedRiders) {
    if (item.isDQ) dqs++;
    const dorsal = item.dorsal.toString();
    const nameInText = item.riderName;
    const entryByDorsal = eventRiders?.find(er => er.dorsal?.toString() === dorsal);
    
    if (entryByDorsal) {
      const pdfName = nameInText;
      const dbNameRaw = getRiderName(entryByDorsal);
      const compatible = isNameCompatible(pdfName, dbNameRaw);
      
      if (!compatible) {
        const riderId = entryByDorsal.rider_id;
        const profile = riders.find(r => r.id === riderId);
        
        // Find other event riders
        const erHistory = allEventRiders.filter(er => er.rider_id === riderId);
        const resHistory = allResults.filter(r => r.rider_id === riderId);
        
        suspects.push({
          dorsal,
          pdfName,
          pdfCat: item.category,
          dbName: dbNameRaw,
          dbRUT: profile.rut,
          dbClub: profile.club,
          dbCat: profile.category,
          historyCount: erHistory.length,
          resultCount: resHistory.length
        });
      }
    }
  }

  console.log("\\n=== REPORT ===");
  console.log("Parseados:", parsedRiders.length);
  console.log("DQs:", dqs);
  console.log("Sospechosos Encontrados:", suspects.length);
  
  for (const s of suspects) {
    console.log(`\\n> Dorsal ${s.dorsal}`);
    console.log(`  PDF: ${s.pdfName} [${s.pdfCat}]`);
    console.log(`  DB : ${s.dbName} [RUT: ${s.dbRUT}, Club: ${s.dbClub}, Cat: ${s.dbCat}]`);
    console.log(`  Historial DB: ${s.historyCount} fechas inscritas, ${s.resultCount} resultados guardados`);
  }
}
run();
