const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: results, error: resultsError } = await supabase.from('results').select('*, riders(full_name, club)');
  if (resultsError) console.error(resultsError);
  
  const { data: ranking, error: rankingError } = await supabase.from('ranking_global').select('*');
  if (rankingError) console.error(rankingError);

  const issues = [];
  
  // 1. Check Individual Ranking
  const calcRanking = {};
  results.forEach(r => {
      if (r.position === 999) return;
      if (!calcRanking[r.rider_id]) {
          calcRanking[r.rider_id] = { points: 0, count: 0, name: r.riders?.full_name };
      }
      calcRanking[r.rider_id].points += r.points;
      calcRanking[r.rider_id].count++;
  });

  if (ranking) {
    ranking.forEach(rk => {
        const calc = calcRanking[rk.rider_id];
        if (!calc) {
            issues.push(`Ranking has rider ${rk.rider_id} (${rk.full_name}) with ${rk.total_points} pts but no valid results found.`);
        } else if (calc.points !== rk.total_points) {
            issues.push(`Points mismatch for ${rk.full_name}: ranking_global=${rk.total_points}, calculated=${calc.points}`);
        }
    });

    Object.keys(calcRanking).forEach(riderId => {
        const rk = ranking.find(r => r.rider_id === riderId);
        if (!rk && calcRanking[riderId].points > 0) {
            issues.push(`Missing from ranking_global: ${calcRanking[riderId].name} with ${calcRanking[riderId].points} pts`);
        }
    });
  }

  // 2. Output
  fs.writeFileSync('scratch/audit_ranking_vs_results.json', JSON.stringify({
      totalResults: results?.length || 0,
      totalRanking: ranking?.length || 0,
      issuesCount: issues.length,
      issues
  }, null, 2));
  
  console.log("Done checking ranking vs results.");
}

run();
