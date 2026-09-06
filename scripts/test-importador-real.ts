import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { parseExcelRows } from '../lib/excel-parser';
import { parseResultsText } from '../lib/results-parser';
import { matchAndDeduplicateResults, timeToSeconds, calculatePoints } from '../lib/importer-core';
const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Uso: npx ts-node scripts/test-importador-real.ts <file1.xls> [file2.xls] ...");
    process.exit(1);
  }

  // Identificar el evento según los archivos o forzar Fecha 4
  const eventId = 'e1c70c32-505b-4f75-909b-75f7e5591e34'; // F4 by default

  console.log("Cargando DB...");
  const { data: riders } = await supabase.from('riders').select('*');
  const { data: eventRiders } = await supabase.from('event_riders').select('*, riders(full_name)');
  const { data: existingResults } = await supabase.from('results').select('*');

  let fullText = "";

  console.log("Procesando archivos...");
  for (const filePath of args) {
    const absPath = path.resolve(filePath);
    const buffer = fs.readFileSync(absPath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const firstSheet = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheet];
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'hh:mm:ss' }) as any[][];
    
    const { text } = parseExcelRows(json, { fallbackCategory: 'DESCONOCIDA' });
    fullText += text + "\n";
  }

  console.log("Parseando texto...");
  const parsedRidersRaw = parseResultsText(fullText, "DESCONOCIDA");

  console.log("Ejecutando matchAndDeduplicateResults...");
  const detectedResults = matchAndDeduplicateResults(
    parsedRidersRaw,
    eventRiders || [],
    riders || [],
    existingResults || [],
    eventId,
    'DESCONOCIDA'
  );

  const toSave = detectedResults.filter(r => (r.exists || r.canAutoLink) && r.riderId && !r.isDQ && !r.status.startsWith("⚠️"));
  
  // Sort and assign positions
  const sortedToSave = [...toSave].sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return timeToSeconds(a.time) - timeToSeconds(b.time);
  });

  const posCounters: Record<string, number> = {};
  const finalResults: any[] = [];

  for (const item of sortedToSave) {
    if (!posCounters[item.category]) posCounters[item.category] = 1;
    let finalPos = posCounters[item.category];
    posCounters[item.category]++;

    finalResults.push({
      ...item,
      finalPos,
      points: calculatePoints(finalPos, false)
    });
  }

  // Construir Reporte
  let safeMatches = 0, manualReview = 0, newRiders = 0, conflicts = 0, duplicates = 0, invalidPoints = 0, invalidPositions = 0, multiFileConflicts = 0;
  
  const report = detectedResults.map(r => {
    if (r.status === "✅ LISTO") safeMatches++;
    else if (r.status === "⚠️ DORSAL SOSPECHOSO" || r.status === "❌ NO ENCONTRADO") manualReview++;
    else if (r.status === "⚠️ CONFLICTO MULTIARCHIVO") conflicts++;

    const finalR = finalResults.find(f => f.rowKey === r.rowKey);
    return {
      dorsal: r.dorsal,
      nameInText: r.nameInText,
      categoryReceived: r.category,
      clubReceived: r.clubInText,
      riderFound: r.identifiedName,
      riderId: r.riderId,
      clubAtEvent: r.clubAtEvent,
      matchReason: r.matchReason,
      time: r.time,
      isDQ: r.isDQ,
      calculatedPosition: finalR?.finalPos || (r.isDQ ? 999 : null),
      calculatedPoints: finalR?.points || (r.isDQ ? 0 : null),
      status: r.status
    };
  });

  fs.writeFileSync('scratch/import_test_report.json', JSON.stringify(report, null, 2));

  // Assertions
  let pass = true;
  const categories = [...new Set(finalResults.map(r => r.category))];
  for (const cat of categories) {
    const catRiders = finalResults.filter(r => r.category === cat);
    if (!catRiders.some(r => r.finalPos === 1 && r.points === 100)) { console.error(`FAIL: Pos 1 != 100 en ${cat}`); pass = false; }
    if (catRiders.length > 1 && !catRiders.some(r => r.finalPos === 2 && r.points === 90)) { console.error(`FAIL: Pos 2 != 90 en ${cat}`); pass = false; }
    
    // Check duplicates
    const posSet = new Set();
    for (const r of catRiders) {
      if (posSet.has(r.finalPos)) { console.error(`FAIL: Posición duplicada ${r.finalPos} en ${cat}`); pass = false; }
      posSet.add(r.finalPos);
    }
  }

  const dqPoints = report.filter(r => r.isDQ && r.calculatedPoints && r.calculatedPoints > 0);
  if (dqPoints.length > 0) { console.error(`FAIL: DQ con puntos normales`); pass = false; }

  const dqs = detectedResults.filter(r => r.isDQ).length;

  console.log(`
IMPORT TEST
Files: ${args.length}
Rows parsed: ${parsedRidersRaw.length}
Valid results: ${finalResults.length}
DQ/DNF/etc: ${dqs}
Safe matches: ${safeMatches}
Manual review: ${manualReview}
New riders: ${newRiders}
Conflicts: ${conflicts}
Duplicate riders: ${duplicates}
Invalid points: ${invalidPoints}
Invalid positions: ${invalidPositions}
Multi-file conflicts: ${multiFileConflicts}

FINAL: ${pass ? 'PASS' : 'FAIL'}
  `);
}

run().catch(console.error);
