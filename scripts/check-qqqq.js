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

async function check() {
  console.log('--- DIAGNÓSTICO DE RIDER QQQQ ---');
  
  // 1. Buscar al rider por nombre
  const { data: rdr } = await supabase
    .from('riders')
    .select('id, full_name, category')
    .ilike('full_name', '%qqqq%')
    .maybeSingle();

  if (!rdr) {
    console.log('❌ ERROR: No existe ningún corredor que se llame QQQQ.');
    return;
  }

  console.log(`✅ Rider encontrado: ${rdr.full_name} (ID: ${rdr.id})`);
  console.log(`Categoría registrada: ${rdr.category}`);

  // 2. Buscar sus dorsales
  const { data: dorsals } = await supabase
    .from('event_riders')
    .select('event_id, dorsal, events(name)')
    .eq('rider_id', rdr.id);

  if (!dorsals || dorsals.length === 0) {
    console.log('❌ ERROR: Este rider existe, pero NO tiene dorsales asignados en ninguna carrera.');
  } else {
    console.log('Dorsales detectados en el sistema:');
    dorsals.forEach(d => {
      console.log(`- Evento: ${d.events.name} | Dorsal: ${d.dorsal}`);
    });
  }

  // 3. Ver qué carreras hay ahora
  const { data: events } = await supabase.from('events').select('id, name');
  console.log('\nCarreras disponibles en el sistema:');
  events.forEach(e => console.log(`- ID: ${e.id} | Nombre: ${e.name}`));

  console.log('--- FIN DEL DIAGNÓSTICO ---');
}

check();
