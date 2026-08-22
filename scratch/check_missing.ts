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

async function checkMissing() {
  const eventId = '12bbdebc-4ab5-4a57-b02d-a6042db6daee'; // We need the ID for 4ª Fecha. Let's find it.
  
  const { data: events } = await supabase.from('events').select('id, name');
  const fecha4 = events.find(e => e.name.includes('4'));
  if (!fecha4) return console.log("No 4th event found");
  
  console.log("Event:", fecha4.name, fecha4.id);
  
  const { data: results, error } = await supabase
    .from('results')
    .select('id, rider_id, position, category_played, race_time')
    .eq('event_id', fecha4.id);
    
  console.log(`Total results saved in DB for ${fecha4.name}: ${results.length}`);
}

checkMissing();
