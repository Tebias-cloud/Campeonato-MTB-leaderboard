const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xfawvzaapepnxcraliat.supabase.co/";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjYxMDgsImV4cCI6MjA4NTc0MjEwOH0.SbB289fSF6dFviyZNW_nY8U3rn1NQTbKYcqFePNONGU";

const supabase = createClient(SUPABASE_URL, API_KEY);

async function main() {
  console.log("Ranking Global for Pre Master Mixto:");
  const { data: ranking, error: rankErr } = await supabase.from('ranking_global')
    .select('*')
    .ilike('category', 'Pre Master Mixto')
    .order('total_points', { ascending: false });
  
  if (rankErr) { console.error("Error ranking:", rankErr); }
  else {
    console.log(ranking.map(r => ({ rider_id: r.rider_id, full_name: r.full_name, category: r.category, total_points: r.total_points })));
  }

  console.log("\nResults for Event 08927adb-29eb-41bc-9376-478ad41a40bc in Pre Master Mixto:");
  const { data: results, error: resErr } = await supabase.from('results')
    .select('*')
    .eq('event_id', '08927adb-29eb-41bc-9376-478ad41a40bc')
    .ilike('category_played', 'Pre Master Mixto')
    .order('position', { ascending: true });
    
  if (resErr) { console.error("Error results:", resErr); }
  else {
    console.log(results.map(r => ({ rider_id: r.rider_id, pos: r.position, pts: r.points, cat: r.category_played })));
  }
}

main();
