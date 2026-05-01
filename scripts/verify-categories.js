const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
  });
}
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function verify() {
  // 1. Obtener eventos para estar seguros del ID
  const { data: events } = await s.from('events').select('id, name').order('date', { ascending: false });
  console.log('Eventos encontrados:', events.map(e => `${e.name} (${e.id})`));
  
  const eventId = events[0].id; // Usar el más reciente
  console.log(`\nVerificando categorías en event_riders para: ${events[0].name}...`);
  
  const { data: participants, error } = await s
    .from('event_riders')
    .select('category_at_event, rider:rider_id(full_name, gender)')
    .eq('event_id', eventId);

  if (error) { console.error('Error fetching participants:', error); return; }
  if (!participants) { console.error('No participants found.'); return; }

  const counts = {};
  participants.forEach(p => {
    const cat = p.category_at_event;
    counts[cat] = (counts[cat] || 0) + 1;
  });

  console.log('\nResumen de categorías reales en la base de datos:');
  console.table(counts);

  // Comprobar mezcla Master A vs Damas Master A
  const filterCat = 'Master A';
  const filtered = participants.filter(p => p.category_at_event === filterCat);
  
  console.log(`\nResultado del filtro EXACTO (.eq) para "${filterCat}":`);
  console.log(`Total encontrados: ${filtered.length}`);
  
  const mixed = filtered.filter(p => p.category_at_event !== filterCat);
  if (mixed.length > 0) {
    console.log('❌ ERROR: El filtro exacto falló (imposible en JS, pero por si acaso).');
  } else {
    console.log('✅ El filtro EXACTO en memoria funciona perfecto.');
  }

  // Verificar si hay mujeres coladas por error en la categoría "Master A" (debería ser varones)
  const womenInMasterA = filtered.filter(p => 
    p.rider?.gender === 'Femenino' || 
    p.category_at_event.toLowerCase().includes('damas')
  );

  if (womenInMasterA.length > 0) {
    console.log('\n⚠️ ALERTA: Hay mujeres inscritas en la categoría "Master A" (Varones) en la DB:');
    womenInMasterA.forEach(p => console.log(` - ${p.rider?.full_name} (Género: ${p.rider?.gender}, Categoría: ${p.category_at_event})`));
  } else {
    console.log('\n✅ NO hay mujeres ni categorías de Damas dentro del grupo de "Master A".');
  }
}
verify();
