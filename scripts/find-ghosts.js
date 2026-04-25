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

async function findGhostRiders() {
  console.log('--- BUSCANDO CORREDORES SIN REGISTRO EN EVENT_RIDERS ---');
  
  // 1. Obtener todos los resultados
  const { data: results } = await supabase.from('results').select('rider_id, event_id');
  
  // 2. Obtener todos los event_riders
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id');
  
  const ghostRiders = [];
  
  for (const res of results) {
    const found = eventRiders.find(er => er.rider_id === res.rider_id && er.event_id === res.event_id);
    if (!found) {
      ghostRiders.push(res);
    }
  }
  
  console.log(`Encontrados ${ghostRiders.length} resultados vinculados a riders que no están en event_riders.`);
  
  if (ghostRiders.length > 0) {
    console.log('Ejemplos:', ghostRiders.slice(0, 5));
    
    // Ver si Alejandro es uno de ellos
    const alejandroId = 'e13dba59-5765-4f3d-a774-be1500bced9d';
    const alejandroGhosts = ghostRiders.filter(g => g.rider_id === alejandroId);
    console.log('Fantasmas de Alejandro:', alejandroGhosts);
  }
}

findGhostRiders();
