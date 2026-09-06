const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const calculatePoints = (pos) => {
    if (pos === 999) return 0;
    if (pos === 1) return 100;
    if (pos <= 10) return 110 - (pos * 10);
    if (pos < 20) return 20 - pos;
    return 1;
};

async function run() {
  const { data: results } = await supabase.from('results').select('*').neq('position', 999);
  
  // Group by event and category
  const groups = {};
  results.forEach(r => {
      const key = `${r.event_id}|${r.category_played}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
  });
  
  const anomalies = [];
  
  Object.keys(groups).forEach(key => {
      const g = groups[key];
      g.sort((a, b) => a.position - b.position);
      
      const posMap = {};
      
      let expectedPos = 1;
      
      g.forEach(r => {
          if (posMap[r.position]) {
              anomalies.push(`Duplicate position ${r.position} in ${key}`);
          }
          posMap[r.position] = true;
          
          if (r.position !== expectedPos) {
              anomalies.push(`Jump in position: expected ${expectedPos} but got ${r.position} in ${key}`);
              expectedPos = r.position; // adjust to continue checking
          }
          
          const expectedPts = calculatePoints(r.position);
          if (r.points !== expectedPts) {
              anomalies.push(`Points mismatch in ${key} for pos ${r.position}: expected ${expectedPts} got ${r.points}`);
          }
          
          expectedPos++;
      });
  });
  
  console.log(`Found ${anomalies.length} anomalies.`);
  if (anomalies.length > 0) {
      console.log(anomalies);
  }
}

run();
