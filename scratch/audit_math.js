const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const f2 = '08927adb-29eb-41bc-9376-478ad41a40bc'; // Fecha 2
  const f4 = '572fcd71-b06f-4ed4-b153-fdfdafa0ec89'; // Fecha 4
  
  const report = {};

  // 1. Fecha 2 Master A
  const { data: masterAF2 } = await supabase.from('results').select('*, riders(full_name)').eq('event_id', f2).eq('category_played', 'Master A').order('position');
  
  // 1. Fecha 2 Elite
  const { data: eliteF2 } = await supabase.from('results').select('*, riders(full_name)').eq('event_id', f2).eq('category_played', 'Elite').order('position');
  
  report.f2 = { masterAF2, eliteF2 };

  // 2. Fecha 4 Novicios Varones
  const { data: noviciosF4 } = await supabase.from('results').select('*, riders(full_name)').eq('event_id', f4).eq('category_played', 'Novicios Varones').order('position');
  
  report.f4 = { noviciosF4 };

  fs.writeFileSync('scratch/audit_math.json', JSON.stringify(report, null, 2));
  console.log("Done");
}

run();
