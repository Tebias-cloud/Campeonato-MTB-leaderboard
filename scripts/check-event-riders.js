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

async function checkEventRiders() {
  const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // 2ª Fecha - Club Chaski
  console.log(`Buscando corredores inscritos en la 2ª Fecha (ID: ${eventId})`);

  const { data, error } = await supabase
    .from('event_riders')
    .select('*, riders(full_name, rut)')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Total inscritos: ${data.length}`);
  
  // Buscar a Alejandro en esta lista
  const alejandro = data.find(er => er.riders && er.riders.full_name && er.riders.full_name.toUpperCase().includes('ALEJANDRO VERGARA'));
  
  if (alejandro) {
    console.log('Alejandro encontrado en la 2ª Fecha:', alejandro);
  } else {
    console.log('Alejandro no encontrado en la 2ª Fecha.');
    // Mostrar algunos para ver el formato
    console.log('Primeros 5 inscritos:', JSON.stringify(data.slice(0, 5), null, 2));
  }
}

checkEventRiders();
