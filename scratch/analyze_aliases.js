const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: riders } = await supabase.from('riders').select('id, full_name, club');
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event');

  const groupsToCheck = [
      ['TEAM CYCLES FRANKLIN', 'CYCLES FRANKLIN'],
      ['TEAM DELFIN', 'DELFIN MTB'],
      ['COBRALINCH MTB', 'COBRA LINCH MTB'],
      ['TEAM DESERT RIDER', 'DESERT RIDER']
  ];
  
  const counts = {};
  riders.forEach(r => {
      const c = (r.club || '').toUpperCase().trim();
      if (!counts[c]) counts[c] = { riders: new Set(), eventRiders: 0 };
      counts[c].riders.add(r.id);
  });
  
  eventRiders.forEach(er => {
      const c = (er.club_at_event || '').toUpperCase().trim();
      if (!counts[c]) counts[c] = { riders: new Set(), eventRiders: 0 };
      counts[c].eventRiders++;
  });
  
  const report = {};
  
  // 1. Determine canonical
  const canonicalMap = {}; // actual -> canonical
  groupsToCheck.forEach(group => {
      let maxCount = -1;
      let canonical = group[0];
      group.forEach(name => {
          const count = (counts[name]?.riders.size || 0) + (counts[name]?.eventRiders || 0);
          if (count > maxCount) {
              maxCount = count;
              canonical = name;
          }
      });
      group.forEach(name => {
          if (name !== canonical) {
              canonicalMap[name] = canonical;
          }
      });
  });
  
  // 2. Resolve Tier B
  // A: TEAM DESERT RIDER CALAMA vs TEAM DESERT RIDER / DESERT RIDER
  const desertRiderCalamaIds = new Set([...riders.filter(r => r.club?.toUpperCase().trim() === 'TEAM DESERT RIDER CALAMA').map(r => r.id), ...eventRiders.filter(er => er.club_at_event?.toUpperCase().trim() === 'TEAM DESERT RIDER CALAMA').map(er => er.rider_id)]);
  
  const desertRiderIds = new Set([...riders.filter(r => r.club?.toUpperCase().trim() === 'TEAM DESERT RIDER' || r.club?.toUpperCase().trim() === 'DESERT RIDER').map(r => r.id), ...eventRiders.filter(er => er.club_at_event?.toUpperCase().trim() === 'TEAM DESERT RIDER' || er.club_at_event?.toUpperCase().trim() === 'DESERT RIDER').map(er => er.rider_id)]);
  
  const overlapA = [...desertRiderCalamaIds].filter(id => desertRiderIds.has(id));
  report.tierBA = {
      calamaRiders: desertRiderCalamaIds.size,
      baseRiders: desertRiderIds.size,
      overlap: overlapA.length,
      decision: overlapA.length > 0 ? "MISMO CLUB CONFIRMADO" : "NO CONFIRMADO"
  };
  
  if (overlapA.length > 0) {
      // Find the canonical for Desert Rider
      let canonicalDR = canonicalMap['DESERT RIDER'] || 'TEAM DESERT RIDER'; 
      if (canonicalMap['TEAM DESERT RIDER']) canonicalDR = canonicalMap['TEAM DESERT RIDER'];
      // The canonical was decided in step 1, but we need to know what it is.
      const groupDR = ['TEAM DESERT RIDER', 'DESERT RIDER'];
      let maxCount = -1;
      groupDR.forEach(name => {
          const count = (counts[name]?.riders.size || 0) + (counts[name]?.eventRiders || 0);
          if (count > maxCount) {
              maxCount = count;
              canonicalDR = name;
          }
      });
      canonicalMap['TEAM DESERT RIDER CALAMA'] = canonicalDR;
  }
  
  // B: RIDER DESERT CALAMA vs RIDER DESERT
  const riderDesertCalamaIds = new Set([...riders.filter(r => r.club?.toUpperCase().trim() === 'RIDER DESERT CALAMA').map(r => r.id), ...eventRiders.filter(er => er.club_at_event?.toUpperCase().trim() === 'RIDER DESERT CALAMA').map(er => er.rider_id)]);
  
  const riderDesertIds = new Set([...riders.filter(r => r.club?.toUpperCase().trim() === 'RIDER DESERT').map(r => r.id), ...eventRiders.filter(er => er.club_at_event?.toUpperCase().trim() === 'RIDER DESERT').map(er => er.rider_id)]);
  
  const overlapB = [...riderDesertCalamaIds].filter(id => riderDesertIds.has(id));
  report.tierBB = {
      calamaRiders: riderDesertCalamaIds.size,
      baseRiders: riderDesertIds.size,
      overlap: overlapB.length,
      decision: overlapB.length > 0 ? "MISMO CLUB CONFIRMADO" : "NO CONFIRMADO"
  };
  
  if (overlapB.length > 0) {
      canonicalMap['RIDER DESERT CALAMA'] = 'RIDER DESERT';
  }
  
  // Create final plan table
  const changes = [];
  Object.keys(canonicalMap).forEach(actual => {
      changes.push({
          actual,
          canonical: canonicalMap[actual],
          ridersAfectados: counts[actual]?.riders.size || 0,
          eventRidersAfectados: counts[actual]?.eventRiders || 0
      });
  });
  report.changes = changes;
  
  // Calculate rankings (approximate for output)
  const { data: results } = await supabase.from('results').select('rider_id, event_id, points');
  
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
      return Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 15);
  }

  const rawRanking = getRawRanking(erMap);
  
  const simErMap = new Map();
  erMap.forEach((club, key) => {
      simErMap.set(key, canonicalMap[club] || club);
  });
  const simRanking = getRawRanking(simErMap);
  
  report.rankingAntes = rawRanking;
  report.rankingDespues = simRanking;
  
  fs.writeFileSync('scratch/alias_plan.json', JSON.stringify(report, null, 2));
  console.log('Analysis complete.');
}
run();
