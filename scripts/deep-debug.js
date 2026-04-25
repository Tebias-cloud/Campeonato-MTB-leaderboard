const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function deepDebug() {
  const targetId = 'e13dba59-5765-4f3d-a774-be1500bced9d'; // Alejandro
  
  console.log('--- EVENTOS ---');
  const { data: events } = await supabase.from('events').select('id, name, date').order('date', { ascending: true });
  console.log(JSON.stringify(events, null, 2));

  console.log('\n--- REGISTROS DE ALEJANDRO EN EVENT_RIDERS ---');
  const { data: er } = await supabase.from('event_riders').select('*, events(name)').eq('rider_id', targetId);
  console.log(JSON.stringify(er, null, 2));

  console.log('\n--- REGISTROS DE ALEJANDRO EN REGISTRATIONS (TABLA ANTIGUA) ---');
  const { data: reg } = await supabase.from('registrations').select('*').eq('rut', '16926854-1');
  console.log(JSON.stringify(reg, null, 2));
}

deepDebug();
