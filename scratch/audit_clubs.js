const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

// Heuristics for matching
function normalizeBasic(name) {
  if (!name) return '';
  return name.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAggressive(name) {
  let cleaned = normalizeBasic(name);
  // Remove common words and punctuation
  cleaned = cleaned.replace(/^(CLUB\s+|TEAM\s+|AGRUPACION\s+)/, '')
                   .replace(/\s+(CLUB|TEAM|MTB)$/, '')
                   .replace(/[^A-Z0-9]/g, '');
  return cleaned;
}

async function run() {
  const { data: riders } = await supabase.from('riders').select('id, club');
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event, riders(full_name)');
  const { data: results } = await supabase.from('results').select('rider_id, event_id, points');

  const allClubs = new Set();
  const clubStats = {}; // { clubName: { totalPoints, riderIds: Set, eventIds: Set } }

  // Extract all distinct clubs from both sources
  riders?.forEach(r => {
    if (r.club && r.club !== 'INDEPENDIENTE / LIBRE') {
      const c = normalizeBasic(r.club);
      allClubs.add(c);
      if (!clubStats[c]) clubStats[c] = { totalPoints: 0, riderIds: new Set(), eventIds: new Set(), source: new Set(['riders']) };
      else clubStats[c].source.add('riders');
      clubStats[c].riderIds.add(r.id);
    }
  });

  const erMap = new Map();
  eventRiders?.forEach(er => {
    if (er.club_at_event && er.club_at_event !== 'INDEPENDIENTE / LIBRE') {
      const c = normalizeBasic(er.club_at_event);
      allClubs.add(c);
      erMap.set(`${er.event_id}-${er.rider_id}`, c);
      if (!clubStats[c]) clubStats[c] = { totalPoints: 0, riderIds: new Set(), eventIds: new Set(), source: new Set(['event_riders']) };
      else clubStats[c].source.add('event_riders');
      clubStats[c].riderIds.add(er.rider_id);
      clubStats[c].eventIds.add(er.event_id);
    }
  });

  // Calculate points for current ranking (historical calculation method as per recent fix)
  // Which uses event_riders.club_at_event
  results?.forEach(res => {
    const club = erMap.get(`${res.event_id}-${res.rider_id}`);
    if (club) {
        // We will attribute points to the exact club name first to see aliases properly
        clubStats[club].totalPoints += (res.points || 0);
    }
  });

  const clubsList = Array.from(allClubs);
  
  // Try to group clubs
  const groups = [];
  const processed = new Set();
  
  // Custom grouping logic
  for (let i = 0; i < clubsList.length; i++) {
    const c1 = clubsList[i];
    if (processed.has(c1)) continue;
    
    const group = { canonical: c1, aliases: [] };
    processed.add(c1);
    
    for (let j = i + 1; j < clubsList.length; j++) {
      const c2 = clubsList[j];
      if (processed.has(c2)) continue;
      
      const n1 = normalizeAggressive(c1);
      const n2 = normalizeAggressive(c2);
      
      // Tier A matching conditions
      const isTierA = n1 === n2 || (c1.replace(/[^A-Z]/g, '') === c2.replace(/[^A-Z]/g, ''));
      
      // Tier B matching conditions
      let isTierB = false;
      if (!isTierA) {
          if (n1.length > 3 && n2.length > 3 && (n1.includes(n2) || n2.includes(n1))) {
              if (Math.abs(n1.length - n2.length) <= 12) isTierB = true;
          }
      }
      
      if (isTierA) {
          group.aliases.push({ name: c2, tier: 'A' });
          processed.add(c2);
      } else if (isTierB) {
          group.aliases.push({ name: c2, tier: 'B' });
          processed.add(c2);
      }
    }
    
    if (group.aliases.length > 0) groups.push(group);
  }

  // Identify the best canonical name for each group (most points or most riders)
  groups.forEach(g => {
      const allNames = [g.canonical, ...g.aliases.map(a => a.name)];
      let trueBest = allNames[0];
      let trueMax = -1;
      
      const officialLogos = ['CLUB TMT', 'TEAM FRANKLIN', 'CLUB CHASKI', 'CLUB COBRA', 'CONDORES B&T', 'IQUIQUE BIKE', 'CLUB CAMANCHACA'];
      
      allNames.forEach(n => {
          let score = clubStats[n].riderIds.size + (clubStats[n].totalPoints / 100);
          if (officialLogos.includes(n)) {
              score += 10000;
          }
          if (score > trueMax) {
              trueMax = score;
              trueBest = n;
          }
      });
      g.canonical = trueBest;
      g.aliases = allNames.filter(n => n !== trueBest).map(n => {
          // re-calculate tier against trueBest
          const n1 = normalizeAggressive(trueBest);
          const n2 = normalizeAggressive(n);
          
          let tier = 'C';
          if (n1 === n2 || (trueBest.replace(/[^A-Z]/g, '') === n.replace(/[^A-Z]/g, ''))) {
            tier = 'A';
          } else if (n1.length > 3 && n2.length > 3 && (n1.includes(n2) || n2.includes(n1)) && Math.abs(n1.length - n2.length) <= 12) {
            tier = 'B';
          }
          
          return { name: n, tier: tier };
      });
      
      // Fix: Some Tier C might have slipped in as Tier B if they were matched transitively.
      // We re-evaluate all aliases against canonical directly.
  });

  // Prepare points for ranking calculation
  const rawRanking = Object.entries(clubStats).map(([name, stats]) => {
      // apply the basic manual normalizations that exist in production code today
      let prodName = name.replace(/^(CLUB\s+|TEAM\s+)/, '').trim();
      if (prodName === 'TMT') prodName = 'CLUB TMT';
      if (prodName === 'COBRA') prodName = 'CLUB COBRA';
      return { original: name, prodName, points: stats.totalPoints };
  });

  const prodRankingMap = {};
  rawRanking.forEach(r => {
      if (!prodRankingMap[r.prodName]) prodRankingMap[r.prodName] = 0;
      prodRankingMap[r.prodName] += r.points;
  });
  const currentTop15 = Object.entries(prodRankingMap).sort((a,b) => b[1] - a[1]).slice(0, 15);

  // Simulated ranking consolidating Tier A
  const simRankingMap = {};
  rawRanking.forEach(r => {
      // Find if original is in a Tier A group
      let canonical = r.original;
      for (const g of groups) {
          if (g.canonical === r.original || g.aliases.some(a => a.name === r.original && a.tier === 'A')) {
              canonical = g.canonical;
              break;
          }
      }
      
      // Apply the same prod fixes just in case
      let prodName = canonical.replace(/^(CLUB\s+|TEAM\s+)/, '').trim();
      if (prodName === 'TMT') prodName = 'CLUB TMT';
      if (prodName === 'COBRA') prodName = 'CLUB COBRA';
      
      if (!simRankingMap[prodName]) simRankingMap[prodName] = 0;
      simRankingMap[prodName] += r.points;
  });
  const simulatedTop15 = Object.entries(simRankingMap).sort((a,b) => b[1] - a[1]).slice(0, 15);

  // Export results to a JSON file for the LLM to format as markdown easily
  // Before exporting, transform sets to sizes/arrays
  const serializableStats = {};
  for (const [k, v] of Object.entries(clubStats)) {
      serializableStats[k] = {
          totalPoints: v.totalPoints,
          ridersCount: v.riderIds.size,
          eventsCount: v.eventIds.size
      };
  }

  fs.writeFileSync('scratch/club_audit_results.json', JSON.stringify({ 
      groups, 
      clubStats: serializableStats,
      currentTop15,
      simulatedTop15
  }, null, 2));
  console.log("Audit complete.");
}

run();
