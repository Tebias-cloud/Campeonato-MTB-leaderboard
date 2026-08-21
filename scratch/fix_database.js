const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- 1. Fixing Jairo Moreno ---");
  const jairoDuplicate = '876316a6-6d22-4a0c-a042-b2e3b5b295c8';
  const jairoMain = '31c94531-504a-4265-9b30-4276d261244a';

  // Update results
  const { data: resData, error: resErr } = await supabase
    .from('results')
    .update({ rider_id: jairoMain })
    .eq('rider_id', jairoDuplicate);
  if (resErr) console.error("Error updating results:", resErr);
  else console.log("Updated Jairo's results.");

  // Update registrations
  const { data: regData, error: regErr } = await supabase
    .from('registrations')
    .update({ rider_id: jairoMain })
    .eq('rider_id', jairoDuplicate);
  if (regErr) console.error("Error updating registrations:", regErr);
  else console.log("Updated Jairo's registrations.");

  // Delete duplicate rider
  const { data: delData, error: delErr } = await supabase
    .from('riders')
    .delete()
    .eq('id', jairoDuplicate);
  if (delErr) console.error("Error deleting duplicate rider:", delErr);
  else console.log("Deleted duplicate rider profile.");

  console.log("\n--- 2. Normalizing Pre Master Mixto ---");
  const { data: pmData, error: pmErr } = await supabase
    .from('results')
    .update({ category_played: 'Pre Master Mixto' })
    .ilike('category_played', 'Pre Master Mixto');
  
  if (pmErr) console.error("Error normalizing category:", pmErr);
  else console.log("Normalized Pre Master Mixto category.");
  
  console.log("\nDone!");
}

run().catch(console.error);
