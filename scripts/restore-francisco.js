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

const rider = {
    "id": "9ddbd327-5ed8-4b39-8c83-c4f5b96f8298",
    "created_at": "2026-04-02T01:52:07.361746+00:00",
    "full_name": "FRANCISCO DANIEL LINCHEO TORREJON",
    "ciudad": "IQUIQUE",
    "birth_date": "1978-05-07",
    "category": "Novicios Varones",
    "club": "COBRALINCH MTB",
    "instagram": null,
    "rut": "13412713-9",
    "email": "franciscolincheo@gmail.com",
    "phone": "+56 9 3084 2831"
  };

async function run() {
  const { error } = await supabase.from('riders').upsert(rider);
  if (error) console.log(error);
  else console.log("Rider restored.");

  // Also restore his registration to event 1 (1ª Fecha - Team Franklin)
  const event_rider = {
    event_id: '04772623-90d4-4bc7-b98f-6f4f79386330', // Fecha 1
    rider_id: rider.id,
    category_at_event: 'Novicios Varones',
    club_at_event: 'COBRALINCH MTB',
    dorsal: null // Or fetch if he had one
  };
  const { error: error2 } = await supabase.from('event_riders').upsert(event_rider);
  if (error2) console.log(error2);
  else console.log("Rider added to event 1");
}
run();
