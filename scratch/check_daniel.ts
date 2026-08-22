import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');

const envVars = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'] || '';
const supabaseKey = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDanielPacheco() {
  console.log("Checking for Daniel Pacheco...");
  const { data: riders, error: ridersError } = await supabase
    .from('riders')
    .select('*')
    .ilike('full_name', '%daniel pacheco%');

  if (ridersError) {
    console.error("Error fetching rider:", ridersError);
    return;
  }
  console.log("Riders found:", riders);

  if (riders && riders.length > 0) {
    const riderId = riders[0].id;
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('*, event:events(name)')
      .eq('rider_id', riderId);
      
    if (resultsError) {
      console.error("Error fetching results:", resultsError);
      return;
    }
    console.log("Results for Daniel Pacheco:", results);
  }
}

checkDanielPacheco();
