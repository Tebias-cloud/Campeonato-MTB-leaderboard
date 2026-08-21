const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Fetching Vicente in Ranking Global ---");
  const { data: vRank } = await supabase.from('ranking_global').select('*').ilike('full_name', '%Jorquera%');
  console.log(vRank);

  console.log("--- Fetching Jairo in Ranking Global ---");
  const { data: jRank } = await supabase.from('ranking_global').select('*').ilike('full_name', '%Jairo%');
  console.log(jRank);
  
  console.log("--- Fetching Pre Master Mixto in Ranking Global ---");
  const { data: pmRank } = await supabase.from('ranking_global').select('*').ilike('category', 'Pre Master Mixto');
  console.log(pmRank);
}

run().catch(console.error);
