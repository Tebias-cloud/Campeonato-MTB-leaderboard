const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  const envPath2 = path.join(__dirname, '..', '.env');
  envContent = fs.readFileSync(envPath2, 'utf8');
}
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkResults() {
  const { data: rider } = await supabase.from('riders').select('*').eq('rut', '13412713-9').single();
  if (rider) {
    console.log("Rider found:", rider.id);
    const { data: results } = await supabase.from('results').select('*').eq('rider_id', rider.id);
    console.log("Results:", results);
    const { data: event_riders } = await supabase.from('event_riders').select('*').eq('rider_id', rider.id);
    console.log("Event Riders:", event_riders);
  } else {
    console.log("Rider not found.");
  }
}

checkResults();
