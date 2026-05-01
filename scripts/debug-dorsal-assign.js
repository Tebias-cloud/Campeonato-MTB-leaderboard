const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FECHA2_ID = '08927adb-29eb-41bc-9376-478ad41a40bc';

async function run() {
  console.log('=== DEBUG: Flujo de assignMassiveDorsals ===\n');

  const category = 'Master A';

  // 1. ¿Qué riders hay en Fecha 2 con esa categoría?
  const { data: participants, error: e1 } = await s
    .from('event_riders')
    .select('id, rider_id, dorsal, category_at_event, club_at_event, created_at, riders(full_name)')
    .eq('event_id', FECHA2_ID)
    .eq('category_at_event', category);

  if (e1) { console.error('Error fetch:', e1.message); return; }
  console.log(`Riders con categoría "${category}" en Fecha 2: ${participants?.length || 0}`);
  participants?.forEach(p => console.log(`  [dorsal=${p.dorsal}] ${p.riders?.full_name} | row id=${p.id}`));

  if (!participants || participants.length === 0) {
    console.log('\n⚠️  No hay riders con esa categoría. Prueba con otra categoría.');
    
    // Mostrar qué categorías hay en Fecha 2
    const { data: cats } = await s.from('event_riders').select('category_at_event').eq('event_id', FECHA2_ID);
    const uniqueCats = [...new Set(cats?.map(c => c.category_at_event))];
    console.log('\nCategorías disponibles en Fecha 2:');
    uniqueCats.forEach(c => console.log(' -', c));
    return;
  }

  // 2. Intentar asignar dorsal 50 al primer rider manualmente
  const testRider = participants[0];
  console.log(`\nIntentando asignar dorsal 50 a: ${testRider.riders?.full_name}...`);
  
  const upsertData = {
    id: testRider.id,
    event_id: FECHA2_ID,
    rider_id: testRider.rider_id,
    dorsal: 50,
    category_at_event: testRider.category_at_event,
    club_at_event: testRider.club_at_event,
    created_at: testRider.created_at
  };
  
  const { error: e2 } = await s.from('event_riders').upsert(upsertData, { onConflict: 'event_id, rider_id' });
  if (e2) { console.error('Error upsert:', e2.message, e2.code); return; }
  
  // 3. Verificar que se guardó
  const { data: check } = await s.from('event_riders').select('dorsal').eq('id', testRider.id).single();
  console.log(`Dorsal guardado en DB: ${check?.dorsal}`);

  if (check?.dorsal === 50) {
    console.log('\n✅ El upsert funciona. El problema está en el UI (render/refresh).');
  } else {
    console.log('\n❌ El upsert NO guardó el dorsal. Problema en el server action.');
  }

  // 4. Limpiar
  await s.from('event_riders').update({ dorsal: null }).eq('id', testRider.id);
  console.log('(dorsal de prueba limpiado)');
}
run();
