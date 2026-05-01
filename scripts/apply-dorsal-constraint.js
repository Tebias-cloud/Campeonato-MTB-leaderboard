const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Supabase JS client no puede ejecutar DDL directamente, pero podemos usar la API de SQL via rpc
  const { error } = await s.rpc('exec_sql', {
    sql: 'ALTER TABLE event_riders ADD CONSTRAINT unique_dorsal_per_event UNIQUE (event_id, dorsal);'
  });

  if (error) {
    // Si exec_sql no existe, intentamos con el método directo
    console.log('rpc exec_sql no disponible:', error.message);
    console.log('\nEjecuta esto manualmente en Supabase SQL Editor:');
    console.log('ALTER TABLE event_riders ADD CONSTRAINT unique_dorsal_per_event UNIQUE (event_id, dorsal);');
  } else {
    console.log('✅ Constraint unique_dorsal_per_event aplicado correctamente.');
  }
}
run();
