const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const pdf = require('pdf-parse');
const XLSX = require('xlsx');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// --- results-parser.ts logic ---
const RIDER_REGEX = /(?:^|\s)(?:(\d+)\s+)?(\d+)\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ][A-ZÁÉÍÓÚÑÜÄËÏÖ0-9\s()\.#&'’/\-]*?)\s+(\d{1,2}:[\d:.]+|DQ|DNF|DNS|DSQ|NC)/gi;
const CATEGORY_KEYWORDS = ['MASTER', 'ELITE', 'NOVICIO', 'DAMAS', 'VARONES', 'MIXTO', 'PRO', 'INFANTIL', 'JUVENIL', 'CADETE', 'SUB', 'EBIKE', 'ENDURO'];

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
      categoryMarkers.push({ index: match.index ?? 0, category: rawCat });
    }
  }

  const excelCatRegex = /CATEGOR[IÍ]A\s*:\s*([^\r\n]+)/gi;
  for (const match of fullText.matchAll(excelCatRegex)) {
    let rawCat = match[1].trim().toUpperCase();
    if (rawCat.includes('PRE MASTER') || rawCat.includes('PREMASTER')) rawCat = 'PRE MASTER MIXTO';
    categoryMarkers.push({ index: match.index ?? 0, category: rawCat });
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
    const idx = match.index ?? 0;
    const dorsal = match[2];
    const rawMatch = match[0].toUpperCase();
    const time = match[4].toUpperCase();
    const isDQ = ['DQ', 'DNF', 'DNS', 'DSQ', 'NC'].includes(time);
    const position = match[1] ? parseInt(match[1]) : (isDQ ? 999 : -1);
    const riderName = match[3].trim();

    if (dorsal.length === 4 && dorsal.startsWith('20')) continue;
    if (rawMatch.includes('PUESTO') || rawMatch.includes('DORSAL')) continue;

    let activeCat = fallbackCategory;
    for (const cm of categoryMarkers) {
      if (cm.index <= idx) {
        activeCat = cm.category;
      } else {
        break;
      }
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

// --- excel-parser.ts logic (simplified) ---
const decodeHtmlEntities = (str) => str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));

const normalizeExcelTime = (raw) => {
  if (raw === null || raw === undefined) return null;
  const str = String(raw).trim().toUpperCase();
  if (!str) return null;
  if (['DNF', 'DNS', 'DSQ', 'DQ', 'NC', 'NF'].includes(str)) return str;
  const timePattern = /^(\d{1,2}):(\d{2}):(\d{2})([.,]\d+)?$/;
  if (timePattern.test(str)) {
    return str.replace(',', '.').replace(/(\.\d{2})\d+$/, '$1');
  }
  const shortPattern = /^(\d{1,2}):(\d{2})$/;
  if (shortPattern.test(str)) return str;
  const num = parseFloat(str.replace(',', '.'));
  if (!isNaN(num) && num > 0 && num < 1) {
    const totalSec = Math.round(num * 86400);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  const isoMatch = str.match(/T(\d{2}:\d{2}:\d{2})/);
  if (isoMatch) return isoMatch[1];
  return null;
};

const normalizeHeader = (h) => h.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

const findColIndex = (headers, aliases) => {
  const normalized = headers.map(normalizeHeader);
  return normalized.findIndex(h => aliases.includes(h));
};

function parseExcelRows(rows, options) {
  const fallbackCategory = options.fallbackCategory;
  if (!rows || rows.length < 2) return { text: '' };

  const header = rows[0].map(h => String(h ?? ''));
  const plIdx = findColIndex(header, ['PL.', 'PL', 'POS', 'POS.', 'LUGAR', 'PUESTO', 'RANK', '#', 'PLACE']);
  const bibIdx = findColIndex(header, ['BIB', 'DORSAL', 'NUM', 'NUMERO', 'N', 'NO.', 'NO', 'NUMBER', 'BIB#']);
  const nameIdx = findColIndex(header, ['NAME', 'NOMBRE', 'ATLETA', 'CORREDOR', 'RIDER', 'NOMBRE COMPLETO', 'FULL NAME']);
  const firstNameIdx = findColIndex(header, ['FIRST NAME', 'FIRSTNAME', 'PRIMER NOMBRE', 'NOMBRE1']);
  const lastNameIdx = findColIndex(header, ['LAST NAME', 'LASTNAME', 'APELLIDO', 'APELLIDOS', 'SURNAME']);
  const timeIdx = findColIndex(header, ['TIME', 'TIEMPO', 'FINISH', 'NET TIME', 'GUN TIME', 'TIEMPO OFICIAL', 'OFICIAL', 'FINISH TIME', 'TOTAL TIME']);
  const statusIdx = findColIndex(header, ['STATUS', 'ESTADO', 'RESULT']);
  const catIdx = findColIndex(header, ['CAT', 'CAT.', 'CATEGORY', 'CATEGORIA', 'CATEGORÍA', 'GRUPO', 'MODALIDAD', 'CLASS']);

  const _plIdx = plIdx !== -1 ? plIdx : 0;
  const _bibIdx = bibIdx !== -1 ? bibIdx : 1;
  const _timeIdx = timeIdx !== -1 ? timeIdx : 7;

  let currentCategory = fallbackCategory;
  let lines = '';
  const cell = (row, idx) => (idx !== -1 && row[idx] !== undefined && row[idx] !== null) ? String(row[idx]).trim() : '';

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;
    const bibVal = cell(row, _bibIdx);
    if (!bibVal || isNaN(Number(bibVal))) {
      const rowText = row.filter(Boolean).join(' ').toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (CATEGORY_KEYWORDS.some(kw => rowText.includes(kw))) {
        currentCategory = rowText.replace(/^(CATEGOR[IA]A?|CAT\.)\s*[:\-]?\s*/i, '').trim();
      }
      continue;
    }

    const rowCategory = catIdx !== -1 ? cell(row, catIdx) : '';
    if (rowCategory) currentCategory = rowCategory.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!currentCategory) currentCategory = fallbackCategory;

    let name = '';
    if (nameIdx !== -1) name = cell(row, nameIdx);
    else if (firstNameIdx !== -1 || lastNameIdx !== -1) name = `${cell(row, firstNameIdx)} ${cell(row, lastNameIdx)}`.trim();
    
    name = decodeHtmlEntities(name);
    name = name.replace(/[()[\]]/g, '').replace(/\s+/g, ' ').trim();
    if (!name) continue;

    let timeRaw = cell(row, _timeIdx);
    if (statusIdx !== -1) {
      const statusVal = cell(row, statusIdx).toUpperCase();
      if (['DNF', 'DNS', 'DSQ', 'DQ', 'NC', 'NF'].includes(statusVal)) timeRaw = statusVal;
    }
    const time = normalizeExcelTime(timeRaw);
    if (!time) continue;

    const pl = cell(row, _plIdx) || '';
    lines += `${pl} ${bibVal} ${name} ${time}\n`;
  }
  return { text: `CATEGORIA: ${currentCategory}\n` + lines };
}

const eventsMap = {
  'fecha1.pdf': '04772623-90d4-4bc7-b98f-6f4f79386330',
  'fecha2.pdf': '08927adb-29eb-41bc-9376-478ad41a40bc',
  'fecha3.pdf': '2649e7c5-3479-4362-a35a-33aa060976cc',
  'fecha4': 'e1c70c32-505b-4f75-909b-75f7e5591e34'
};
const DOWNLOADS_DIR = 'C:\\Users\\esteb\\Downloads';

async function run() {
  const report = {};
  const { data: dbResults, error } = await supabase.from('results').select('*, riders(full_name)');
  if (error) console.error("Error fetching results", error);
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, dorsal');

  // Enrich dbResults with dorsal
  const enrichedResults = dbResults?.map(r => {
    const er = eventRiders?.find(e => e.rider_id === r.rider_id && e.event_id === r.event_id);
    return { ...r, dorsal: er ? er.dorsal : null };
  }) || [];

  for (const filename of ['fecha1.pdf', 'fecha2.pdf', 'fecha3.pdf']) {
    const eventId = eventsMap[filename];
    const path = `${DOWNLOADS_DIR}\\${filename}`;
    if (!fs.existsSync(path)) continue;
    
    const dataBuffer = fs.readFileSync(path);
    const data = await pdf(dataBuffer);
    const parsed = parseResultsText(data.text);
    
    report[filename] = compareWithDB(parsed, eventId, enrichedResults);
  }

  const fecha4Results = [];
  for (const filename of ['fecha4.1.xls', 'fecha4.2.xls']) {
    const path = `${DOWNLOADS_DIR}\\${filename}`;
    if (!fs.existsSync(path)) continue;

    const workbook = XLSX.readFile(path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const { text } = parseExcelRows(excelData, { fallbackCategory: 'DESCONOCIDA' });
    const parsed = parseResultsText(text);
    fecha4Results.push(...parsed);
  }
  if (fecha4Results.length > 0) {
      report['fecha4 (xls)'] = compareWithDB(fecha4Results, eventsMap['fecha4'], enrichedResults);
  }

  const { data: rankingDb } = await supabase.from('ranking').select('*');
  fs.writeFileSync('scratch/test_report.json', JSON.stringify({ discrepancies: report, totalRankingRows: rankingDb?.length }, null, 2));
  console.log('Comparisons completed. See scratch/test_report.json');
}

function compareWithDB(parsed, eventId, dbResults) {
  const eventDb = dbResults.filter(r => r.event_id === eventId);
  const issues = [];
  
  parsed.forEach(p => {
    const d = p.dorsal;
    let found = false;
    for (const r of eventDb) {
      if (r.dorsal === d || (r.riders && r.riders.full_name === p.riderName)) {
        found = true;
        
        if (p.time && p.time !== 'NC' && r.time_raw && r.time_raw !== 'NC') {
          if (p.time !== r.time_raw) {
              const t1 = p.time.replace(/^0:/, '');
              const t2 = r.time_raw.replace(/^0:/, '');
              if (t1 !== t2) {
                  issues.push(`Time mismatch for ${p.riderName}: parsed=${p.time}, db=${r.time_raw}`);
              }
          }
        }
        
        if (p.position && p.position !== 999 && p.position !== -1) {
            if (p.position !== r.position) {
                issues.push(`Position mismatch for ${p.riderName}: parsed=${p.position}, db=${r.position}`);
            }
        }
        break;
      }
    }
    if (!found) {
        issues.push(`Parsed rider not found in DB: dorsal ${p.dorsal} - ${p.riderName}`);
    }
  });

  return {
    parsedCount: parsed.length,
    dbCount: eventDb.length,
    issuesCount: issues.length,
    issues: issues.slice(0, 50)
  };
}

run().catch(console.error);
