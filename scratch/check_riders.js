const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Checking Jairo Moreno ---");
  let { data: jairo } = await supabase.from('riders').select('*').ilike('full_name', '%Jairo%');
  console.log("Jairo Riders:", jairo);

  let jairoIds = jairo?.map(r => r.id) || [];
  if (jairoIds.length > 0) {
      let { data: jairoResults } = await supabase.from('race_results').select('*').in('rider_id', jairoIds);
      console.log("Jairo Results:", jairoResults);
  }

  console.log("\n--- Checking Vicente Jorquera ---");
  let { data: vicente } = await supabase.from('riders').select('*').ilike('full_name', '%Vicente Jorquera%');
  console.log("Vicente Riders:", vicente);
  
  let vicenteIds = vicente?.map(r => r.id) || [];
  if (vicenteIds.length > 0) {
      let { data: vicenteResults } = await supabase.from('race_results').select('*').in('rider_id', vicenteIds);
      console.log("Vicente Results:", vicenteResults);
  }

  console.log("\n--- Checking Miguel Rivera ---");
  let { data: miguel } = await supabase.from('riders').select('*').ilike('full_name', '%Miguel Rivera%');
  console.log("Miguel Riders:", miguel);
}

run().catch(console.error);
