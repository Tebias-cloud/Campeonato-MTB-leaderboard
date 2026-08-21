import fs from 'fs';
import * as XLSX from 'xlsx';
import { parseExcelRows } from '../lib/excel-parser';

// 1. Leer el archivo Excel
const filePath = 'C:/Users/Esteban/Downloads/results.xls'; // Ajustar si es necesario
if (!fs.existsSync(filePath)) {
  console.log("No se encontró results.xls. Asegúrate de tenerlo en la raíz o descargas.");
  process.exit(1);
}

const buffer = fs.readFileSync(filePath);
const workbook = XLSX.read(buffer, { type: 'buffer' });
const firstSheet = workbook.SheetNames[0];
const worksheet = workbook.Sheets[firstSheet];
const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'hh:mm:ss' }) as any[][];

// 2. Parsear el Excel a texto
const { text, warnings } = parseExcelRows(json, { fallbackCategory: 'DESCONOCIDA' });

// 3. Simular la lógica de LiveResultsModal.tsx
const RIDER_REGEX = new RegExp("(?:(\\d+)\\s+)?(\\d+)\\s+([A-ZÁÉÍÓÚÑÜÄËÏÖ\\s()\\.#&\\'\\/-]{3,})\\s+(\\d{1,2}:[\\d:.]+|DQ)", "gi");

let posCounter = 1;
let currentCategory = 'DESCONOCIDA';
const liveResults: any[] = [];
const lines = text.split(/\r?\n/);

lines.forEach(line => {
  const cleanLine = line.trim();
  if (!cleanLine || cleanLine.length < 2) return;

  const upper = cleanLine.toUpperCase();
  const catKeywords = ['MASTER', 'ELITE', 'NOVICIO', 'DAMAS', 'VARONES', 'MIXTO', 'PRO', 'INFANTIL', 'JUVENIL', 'CADETE', 'SUB', 'EBIKE', 'ENDURO'];
  const isNoise = upper.includes('PUESTO') || upper.includes('DORSAL') || upper.includes('PAGINA') || upper.includes('RESULTADOS') || upper.includes('OFICIAL') || upper.includes('TIEMPO');

  if (catKeywords.some(kw => upper.includes(kw)) && !isNoise && upper.length < 60 && !upper.match(/\d{1,2}:\d{2}/)) {
    let detected = upper.replace(/^(CATEGOR[IÍ]A|CATEGORIA|CAT\.|RANKING|RESULTADOS|FECHA)\s*[:\-]?\s*/i, '').trim();
    if (detected.includes('PRE MASTER') || detected.includes('PREMASTER')) detected = 'PRE MASTER MIXTO';
    currentCategory = detected;
    posCounter = 1;
    return;
  }

  const riderMatches = Array.from(cleanLine.matchAll(RIDER_REGEX));
  riderMatches.forEach(match => {
    const posText = match[1];
    const dorsal = match[2];
    const rawName = match[3].trim().toUpperCase();
    const time = match[4].toUpperCase();

    if (dorsal.length === 4 && dorsal.startsWith('20')) return;
    if (rawName.includes('PUESTO') || rawName.includes('DORSAL')) return;

    const isDQ = time === 'DQ' || time === 'DNF' || time === 'DNS' || time === 'DSQ';
    const position = isDQ ? 999 : (posText ? parseInt(posText, 10) : posCounter++);
    const nameInText = rawName.split('(')[0].trim();

    liveResults.push({
      rider_name: nameInText,
      category_played: currentCategory,
      position,
      race_time: isDQ ? 'DQ' : time,
      dorsal
    });
  });
});

console.log(`✅ Prueba Live Results finalizada. Se procesaron ${liveResults.length} resultados.`);
console.log("\nPrimeros 5 resultados detectados:");
console.table(liveResults.slice(0, 5));
console.log("\nÚltimos 5 resultados detectados:");
console.table(liveResults.slice(-5));

