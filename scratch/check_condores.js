const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  // 1. Ver si hay corredores
  const { data: riders } = await supabase.from('riders').select('*').ilike('club', '%condor%');
  console.log(`Corredores inscritos en clubes con 'condor': ${riders ? riders.length : 0}`);
  if (riders && riders.length > 0) {
     console.log("Corredores:");
     riders.forEach(r => console.log(` - ${r.full_name} (${r.club})`));
  }
  
  // 2. Ver si tienen puntos en ranking_global
  const { data: ranking } = await supabase.from('ranking_global').select('*').ilike('club', '%condor%');
  console.log(`\nPuntos en ranking_global para clubes con 'condor':`);
  if (ranking && ranking.length > 0) {
      let total = 0;
      ranking.forEach(r => {
          console.log(` - ${r.full_name}: ${r.total_points} pts`);
          total += r.total_points;
      });
      console.log(`Total Puntos del Club: ${total}`);
  } else {
      console.log("Ningún corredor con 'condor' ha puntuado en el ranking global.");
  }
}

run().catch(console.error);
