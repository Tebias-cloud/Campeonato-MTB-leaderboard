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

async function restoreRiders() {
  const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // 2ª Fecha
  
  const ridersToRestore = [
    { rut: '16926854-1', name: 'ALEJANDRO VERGARA', id: 'e13dba59-5765-4f3d-a774-be1500bced9d' },
    { rut: '17092225-5', name: 'ALBERT JAVIER CAROCA ROBLES', id: '4dc81830-6b6a-4b15-bd91-bf571daf2f76' }
  ];

  console.log(`Inscribiendo ${ridersToRestore.length} corredores en la 2ª Fecha...`);

  for (const rider of ridersToRestore) {
    const { data, error } = await supabase
      .from('event_riders')
      .insert({
        event_id: eventId,
        rider_id: rider.id
      })
      .select();

    if (error) {
      console.error(`❌ Error al inscribir a ${rider.name}:`, error.message);
    } else {
      console.log(`✅ ${rider.name} inscrito correctamente.`);
    }
  }

  console.log('\nProceso finalizado.');
}

restoreRiders();
