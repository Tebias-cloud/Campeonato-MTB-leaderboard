import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
// @ts-ignore
import pdf from 'pdf-parse';
import * as XLSX from 'xlsx';
import { parseResultsText } from '../lib/results-parser';
import { parseExcelRows } from '../lib/excel-parser';

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const eventsMap: Record<string, string> = {
  'fecha1.pdf': '04772623-90d4-4bc7-b98f-6f4f79386330',
  'fecha2.pdf': '08927adb-29eb-41bc-9376-478ad41a40bc',
  'fecha3.pdf': '2649e7c5-3479-4362-a35a-33aa060976cc',
  'fecha4': 'e1c70c32-505b-4f75-909b-75f7e5591e34'
};

const DOWNLOADS_DIR = 'C:\\Users\\esteb\\Downloads';

async function run() {
  const report: any = {};
  const { data: dbResults } = await supabase.from('results').select('*, riders(full_name, dorsal)');

  // 1. Process PDFs
  for (const filename of ['fecha1.pdf', 'fecha2.pdf', 'fecha3.pdf']) {
    const eventId = eventsMap[filename];
    const path = `${DOWNLOADS_DIR}\\${filename}`;
    if (!fs.existsSync(path)) {
        console.log(`Missing ${path}`);
        continue;
    }
    
    const dataBuffer = fs.readFileSync(path);
    const data = await pdf(dataBuffer);
    const parsed = parseResultsText(data.text);
    
    report[filename] = compareWithDB(parsed, eventId, dbResults);
  }

  // 2. Process XLS (Fecha 4)
  const fecha4Results: any[] = [];
  for (const filename of ['fecha4.1.xls', 'fecha4.2.xls']) {
    const path = `${DOWNLOADS_DIR}\\${filename}`;
    if (!fs.existsSync(path)) continue;

    const workbook = XLSX.readFile(path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    const { text } = parseExcelRows(excelData as any[][], { fallbackCategory: 'DESCONOCIDA' });
    const parsed = parseResultsText(text);
    fecha4Results.push(...parsed);
  }
  if (fecha4Results.length > 0) {
      report['fecha4 (xls)'] = compareWithDB(fecha4Results, eventsMap['fecha4'], dbResults);
  }

  // 3. Current Ranking Validation
  const { data: rankingDb } = await supabase.from('ranking').select('*');
  
  // Save report
  fs.writeFileSync('scratch/test_report.json', JSON.stringify({ discrepancies: report, totalRankingRows: rankingDb?.length }, null, 2));
  console.log('Comparisons completed. See scratch/test_report.json');
}

function compareWithDB(parsed: any[], eventId: string, dbResults: any[] | null) {
  if (!dbResults) return { error: 'No db results' };
  
  const eventDb = dbResults.filter(r => r.event_id === eventId);
  const issues: string[] = [];

  // Find missing in DB
  const parsedMap = new Map();
  parsed.forEach(p => {
    // try to match by dorsal or name
    const d = p.dorsal;
    let found = false;
    for (const r of eventDb) {
      if (r.riders && (r.riders.dorsal === d || r.riders.full_name === p.riderName)) {
        found = true;
        
        // compare time
        if (p.time && p.time !== 'NC' && r.time_raw && r.time_raw !== 'NC') {
          if (p.time !== r.time_raw) {
              const t1 = p.time.replace(/^0:/, '');
              const t2 = r.time_raw.replace(/^0:/, '');
              if (t1 !== t2) {
                  issues.push(`Time mismatch for ${p.riderName}: parsed=${p.time}, db=${r.time_raw}`);
              }
          }
        }
        
        // compare position
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
    issues: issues.slice(0, 50) // limit to 50
  };
}

run().catch(console.error);
