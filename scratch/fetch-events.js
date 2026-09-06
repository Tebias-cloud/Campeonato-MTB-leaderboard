const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)[1].trim();
const supabaseKey = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)[1].trim();

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('events').select('id, name, live_results_json').not('live_results_json', 'is', null);
  if (error) {
    console.error(error);
    return;
  }
  fs.writeFileSync('scratch/live_results_json.json', JSON.stringify(data, null, 2));
  console.log("Written to scratch/live_results_json.json");
}

main();
