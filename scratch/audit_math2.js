const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const f4 = 'e1c70c32-505b-4f75-909b-75f7e5591e34'; // Fecha 4
  
  const report = {};

  // 2. Fecha 4 Novicios Varones
  const { data: noviciosF4 } = await supabase.from('results').select('*, riders(full_name)').eq('event_id', f4).eq('category_played', 'Novicios Varones').order('position');
  
  report.f4 = { noviciosF4 };

  fs.writeFileSync('scratch/audit_math.json', JSON.stringify(report, null, 2));
  console.log("Done");
}

run();
