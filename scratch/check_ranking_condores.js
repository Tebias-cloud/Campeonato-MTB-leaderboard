const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data } = await supabase.from('ranking_global').select('*');
  
  const clubScores = {};
  data.forEach(item => {
      if (item.club && item.club !== 'INDEPENDIENTE / LIBRE') {
          if (!clubScores[item.club]) clubScores[item.club] = { points: 0, riders: new Set() };
          clubScores[item.club].points += item.total_points;
          clubScores[item.club].riders.add(item.rider_id);
      }
  });
  
  const clubRankingList = Object.entries(clubScores).map(([clubName, stats]) => ({
      clubName,
      points: stats.points,
      ridersCount: stats.riders.size
  })).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.clubName.localeCompare(b.clubName);
  });
  
  console.log(`Total de clubes en el ranking: ${clubRankingList.length}`);
  const condores = clubRankingList.find(c => c.clubName.toLowerCase().includes('condor'));
  
  if (condores) {
      console.log('Sí está en la lista:', condores);
      const index = clubRankingList.findIndex(c => c.clubName === condores.clubName);
      console.log(`Está en la posición: ${index + 1} de ${clubRankingList.length}`);
  } else {
      console.log('Efectivamente NO está en la lista de agrupados.');
  }
}

run().catch(console.error);
