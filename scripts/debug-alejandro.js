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

async function debugAlejandro() {
  const targetRut = '16926854-1';
  const cleanTargetRut = targetRut.replace(/[\.-]/g, '');

  console.log(`Buscando rider con RUT: ${targetRut}`);

  // 1. Buscar en riders
  const { data: riders, error: riderError } = await supabase
    .from('riders')
    .select('*');

  if (riderError) {
    console.error('Error buscando riders:', riderError);
    return;
  }

  const alejandro = riders.find(r => r.rut && r.rut.replace(/[\.-]/g, '') === cleanTargetRut);

  if (!alejandro) {
    console.log('No se encontró al rider en la tabla "riders".');
    
    // Buscar en registration_requests
    const { data: requests } = await supabase.from('registration_requests').select('*');
    const request = requests.find(r => r.rut && r.rut.replace(/[\.-]/g, '') === cleanTargetRut);
    
    if (request) {
      console.log('Encontrado en registration_requests:', request);
    } else {
      console.log('Tampoco se encontró en registration_requests.');
    }
    return;
  }

  console.log('Rider encontrado:', alejandro);

  // 2. Buscar en event_riders (si existe)
  try {
    const { data: eventRiders, error: erError } = await supabase
      .from('event_riders')
      .select('*, events(name)')
      .eq('rider_id', alejandro.id);
    
    if (!erError) {
      console.log('Registros en event_riders:', eventRiders);
    } else {
      console.log('Error o no existe tabla event_riders:', erError.message);
    }
  } catch (e) {
    console.log('La tabla event_riders probablemente no existe.');
  }

  // 3. Buscar en results
  const { data: results, error: resError } = await supabase
    .from('results')
    .select('*, events(name)')
    .eq('rider_id', alejandro.id);

  if (resError) {
    console.log('Error buscando resultados:', resError.message);
  } else {
    console.log('Resultados encontrados:', results);
  }

  // 4. Buscar todos los eventos para ver cuáles hay
  const { data: events } = await supabase.from('events').select('*');
  console.log('Eventos disponibles:', events.map(e => ({ id: e.id, name: e.name })));
}

debugAlejandro();
