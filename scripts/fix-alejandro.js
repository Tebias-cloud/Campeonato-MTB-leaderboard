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

async function fixAlejandro() {
  const riderId = 'e13dba59-5765-4f3d-a774-be1500bced9d'; // Alejandro Vergara
  const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // 2ª Fecha - Club Chaski

  console.log(`Registrando a Alejandro Vergara (${riderId}) en el evento ${eventId}...`);

  const { error } = await supabase
    .from('event_riders')
    .upsert({
      event_id: eventId,
      rider_id: riderId,
      category_at_event: 'Elite',
      club_at_event: 'RIDER DESERT'
    }, {
      onConflict: 'event_id,rider_id'
    });

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Alejandro registrado con éxito.');
  }
  
  // También para la 1ª Fecha por integridad histórica (aunque ya tiene resultado)
  const fecha1Id = '04772623-90d4-4bc7-b98f-6f4f79386330';
  console.log(`Sincronizando también la 1ª Fecha por integridad...`);
  await supabase.from('event_riders').upsert({
      event_id: fecha1Id,
      rider_id: riderId,
      category_at_event: 'Elite',
      club_at_event: 'RIDER DESERT'
  }, { onConflict: 'event_id,rider_id' });
  
  // Albert Caroca también falta en Fecha 1 (según find-ghosts.js)
  const albertId = '4dc81830-6b6a-4b15-bd91-bf571daf2f76';
  await supabase.from('event_riders').upsert({
      event_id: fecha1Id,
      rider_id: albertId,
      category_at_event: 'Master A',
      club_at_event: 'JALLALLA BIKE'
  }, { onConflict: 'event_id,rider_id' });
  
  console.log('✅ Sincronización histórica completada.');
}

fixAlejandro();
