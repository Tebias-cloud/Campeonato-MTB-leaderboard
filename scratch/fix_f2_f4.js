const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const timeToSeconds = (timeStr) => {
    if (!timeStr || timeStr.toUpperCase() === 'DQ') return 999999;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 999999;
};

const calculatePoints = (pos, isDQ = false) => {
    if (isDQ || pos === 999) return 0;
    if (pos === 1) return 100;
    if (pos <= 10) return 110 - (pos * 10);
    if (pos < 20) return 20 - pos;
    return 1;
};

async function run() {
  console.log("1. Fixing Diego Biskupovic in F2...");
  const f2 = '08927adb-29eb-41bc-9376-478ad41a40bc';
  const diego = '5ff4b044-ea7a-4f25-b0a1-55b7c06f6e9e';
  
  const { error: err1 } = await supabase
    .from('results')
    .update({ category_played: 'Elite' })
    .eq('event_id', f2)
    .eq('rider_id', diego);
    
  if (err1) { console.error(err1); return; }
  console.log("Diego fixed.");

  console.log("2. Fixing Novicios Varones in F4...");
  const f4 = 'e1c70c32-505b-4f75-909b-75f7e5591e34';
  
  const { data: novicios } = await supabase
    .from('results')
    .select('id, race_time')
    .eq('event_id', f4)
    .eq('category_played', 'Novicios Varones');
    
  // Filter out DQ if any (wait, they should not get points, but let's sort them all)
  const valid = novicios.filter(r => r.race_time && r.race_time.toUpperCase() !== 'DQ');
  const dqs = novicios.filter(r => !r.race_time || r.race_time.toUpperCase() === 'DQ');
  
  valid.sort((a, b) => timeToSeconds(a.race_time) - timeToSeconds(b.race_time));
  
  for (let i = 0; i < valid.length; i++) {
      const pos = i + 1;
      const pts = calculatePoints(pos);
      await supabase
        .from('results')
        .update({ position: pos, points: pts })
        .eq('id', valid[i].id);
  }
  
  for (const dq of dqs) {
      await supabase
        .from('results')
        .update({ position: 999, points: 0 })
        .eq('id', dq.id);
  }
  
  console.log("Novicios Varones F4 fixed.");
}

run();
