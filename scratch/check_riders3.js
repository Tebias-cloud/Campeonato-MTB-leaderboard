const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Fetching Jairo Results ---");
  const jairoIds = ['876316a6-6d22-4a0c-a042-b2e3b5b295c8', '31c94531-504a-4265-9b30-4276d261244a'];
  const { data: jairoRes } = await supabase.from('results').select('*').in('rider_id', jairoIds);
  console.log(jairoRes);

  console.log("--- Fetching Vicente Riders ---");
  const { data: vicenteRiders } = await supabase.from('riders').select('*').ilike('full_name', '%Vicente%');
  console.log(vicenteRiders);

  if (vicenteRiders && vicenteRiders.length > 0) {
      const vIds = vicenteRiders.map(r => r.id);
      const { data: vRes } = await supabase.from('results').select('*').in('rider_id', vIds);
      console.log("--- Vicente Results ---");
      console.log(vRes);
  }

  console.log("--- Fetching All Pre Master Mixto Results ---");
  const { data: pmRes } = await supabase.from('results').select('*, rider:riders(*)').ilike('category_played', '%Pre Master%');
  pmRes?.forEach(r => {
      console.log(`- ${r.rider?.full_name} (${r.rider_id}) | Pts: ${r.points} | Race: ${r.event_id} | Pos: ${r.position}`);
  });
}

run().catch(console.error);
