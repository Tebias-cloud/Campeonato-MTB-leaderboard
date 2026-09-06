const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: results } = await supabase.from('results').select('rider_id, event_id, points');
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event');

  const erMap = new Map();
  eventRiders?.forEach(er => {
    if (er.club_at_event && er.club_at_event !== 'INDEPENDIENTE / LIBRE') {
      const c = (er.club_at_event || '').toUpperCase().trim();
      erMap.set(`${er.event_id}-${er.rider_id}`, c);
    }
  });

  function getRawRanking(map) {
      const stats = {};
      results?.forEach(res => {
          const club = map.get(`${res.event_id}-${res.rider_id}`);
          if (club) {
              let prodName = club.replace(/^(CLUB\s+|TEAM\s+)/, '').trim();
              if (prodName === 'TMT') prodName = 'CLUB TMT';
              if (prodName === 'COBRA') prodName = 'CLUB COBRA';
              
              if (prodName !== 'INDEPENDIENTE / LIBRE' && prodName !== 'INDEPENDIENTE') {
                  if (!stats[prodName]) stats[prodName] = 0;
                  stats[prodName] += res.points || 0;
              }
          }
      });
      return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  }

  const rawRanking = getRawRanking(erMap);
  
  const simErMap = new Map();
  erMap.forEach((club, key) => {
      let canon = club;
      if (club === 'RIDER DESERT') canon = 'TEAM DESERT RIDER';
      simErMap.set(key, canon);
  });
  const simRanking = getRawRanking(simErMap);
  
  // Find points for DESERT RIDER group
  const rawDesert = rawRanking.find(r => r[0] === 'DESERT RIDER')?.[1] || 0;
  const rawRiderDesert = rawRanking.find(r => r[0] === 'RIDER DESERT')?.[1] || 0;
  const simDesert = simRanking.find(r => r[0] === 'DESERT RIDER')?.[1] || 0;

  fs.writeFileSync('scratch/simulate_rider_desert.json', JSON.stringify({
      rawRanking: rawRanking.slice(0, 15),
      simRanking: simRanking.slice(0, 15),
      pointsBefore: { 'DESERT RIDER': rawDesert, 'RIDER DESERT': rawRiderDesert },
      pointsAfter: { 'DESERT RIDER': simDesert }
  }, null, 2));

  console.log('Simulated');
}
run();
