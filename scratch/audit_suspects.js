const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const f2 = '08927adb-29eb-41bc-9376-478ad41a40bc';
  const f3 = '2649e7c5-3479-4362-a35a-33aa060976cc';
  
  const report = {};

  const namesF2 = ['%VICTOR%VENEGAS%', '%EMILY%KEITH%', '%DIEGO%BISKUPOVIC%', '%GEOVANNY%PIZARRO%', '%DIABLOS%IQUIQUE%'];
  
  for (const n of namesF2) {
      const { data: riders } = await supabase.from('riders').select('*').ilike('full_name', n);
      for (const r of riders) {
          const { data: results } = await supabase.from('results').select('*').eq('rider_id', r.id).eq('event_id', f2);
          const { data: ers } = await supabase.from('event_riders').select('*').eq('rider_id', r.id).eq('event_id', f2);
          
          if (!report[n]) report[n] = [];
          report[n].push({ rider: r, results, event_riders: ers });
      }
  }

  const namesF3 = ['%LUCIA%LOVERA%', '%LETY%LOVERA%'];
  for (const n of namesF3) {
      const { data: riders } = await supabase.from('riders').select('*').ilike('full_name', n);
      for (const r of riders) {
          const { data: results } = await supabase.from('results').select('*').eq('rider_id', r.id).eq('event_id', f3);
          const { data: ers } = await supabase.from('event_riders').select('*').eq('rider_id', r.id).eq('event_id', f3);
          
          if (!report[n]) report[n] = [];
          report[n].push({ rider: r, results, event_riders: ers });
      }
  }

  fs.writeFileSync('scratch/audit_suspects_results.json', JSON.stringify(report, null, 2));
  console.log("Done");
}

run();
