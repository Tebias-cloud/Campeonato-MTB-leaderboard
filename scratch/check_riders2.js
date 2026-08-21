const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Fetching Pre Master Mixto Ranking ---");
  const { data: results, error } = await supabase
    .from('race_results')
    .select(`
      *,
      rider:riders(*)
    `)
    .ilike('category_played', '%Pre Master%');
    
  if (error) console.error("Error:", error);
  
  if (results) {
      console.log(`Found ${results.length} results for Pre Master Mixto`);
      results.forEach(r => {
          console.log(`- Rider: ${r.rider?.full_name} (${r.rider_id}) | Points: ${r.points} | Race: ${r.event_id} | Pos: ${r.position}`);
      });
  }
}

run().catch(console.error);
