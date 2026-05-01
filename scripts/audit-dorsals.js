const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('=== AUDITORÍA COMPLETA DE DORSALES ===\n');

  // 1. Todos los dorsales asignados en todos los eventos
  const { data: allDorsals } = await s
    .from('event_riders')
    .select('dorsal, event_id, rider_id, category_at_event, riders(full_name, rut), events(name)')
    .not('dorsal', 'is', null)
    .order('event_id')
    .order('dorsal');

  if (!allDorsals || allDorsals.length === 0) {
    console.log('No hay dorsales asignados en ningún evento todavía.');
  } else {
    // Agrupar por evento
    const byEvent = {};
    for (const d of allDorsals) {
      const eName = d.events?.name || d.event_id;
      if (!byEvent[eName]) byEvent[eName] = [];
      byEvent[eName].push(d);
    }

    for (const [eventName, dorsals] of Object.entries(byEvent)) {
      console.log(`\n--- ${eventName} (${dorsals.length} dorsales asignados) ---`);
      
      // Verificar duplicados
      const dorsalNums = dorsals.map(d => d.dorsal);
      const dupes = dorsalNums.filter((n, i) => dorsalNums.indexOf(n) !== i);
      
      if (dupes.length > 0) {
        console.log(`  ⛔ DUPLICADOS DETECTADOS: ${[...new Set(dupes)].join(', ')}`);
      } else {
        console.log(`  ✓ Sin dorsales duplicados`);
      }

      // Mostrar tabla
      dorsals.forEach(d => {
        console.log(`  [${String(d.dorsal).padStart(3, ' ')}] ${(d.riders?.full_name || '?').padEnd(40, ' ')} | ${d.category_at_event}`);
      });
    }
  }

  // 2. Riders con dorsal null (inscritos pero sin dorsal aún)
  const { data: withoutDorsal } = await s
    .from('event_riders')
    .select('rider_id, event_id, riders(full_name), events(name)')
    .is('dorsal', null);

  console.log(`\n=== RIDERS SIN DORSAL ASIGNADO: ${withoutDorsal?.length ?? 0} ===`);
  if (withoutDorsal && withoutDorsal.length > 0) {
    withoutDorsal.slice(0, 10).forEach(d => {
      console.log(`  ${(d.riders?.full_name || '?').padEnd(40, ' ')} → ${d.events?.name}`);
    });
    if (withoutDorsal.length > 10) console.log(`  ... y ${withoutDorsal.length - 10} más`);
  }

  // 3. Verificar estructura de la tabla event_riders
  const { data: sample } = await s.from('event_riders').select('*').limit(1).single();
  console.log('\n=== ESTRUCTURA DE event_riders (columnas) ===');
  if (sample) console.log(' ', Object.keys(sample).join(', '));

  // 4. ¿Hay constraint UNIQUE en dorsal+event? (intentar insertar duplicado)
  console.log('\n=== TEST DE INTEGRIDAD: ¿Permite duplicar dorsal? ===');
  // Usar el rider de prueba que ya tiene dorsal 1 en Fecha 2
  const TEST_RIDER = '44ade940-bf08-4475-b708-791261f3cea2';
  const FECHA2_ID = '08927adb-29eb-41bc-9376-478ad41a40bc';
  
  // Crear un rider temporal para intentar asignarle dorsal 1
  const { data: tempRider } = await s.from('riders').insert({
    full_name: 'TEMP DORSAL TEST', rut: '77.777.777-7', category: 'Novicios Varones',
    club: 'TEST', ciudad: 'IQUIQUE'
  }).select('id').single();

  if (tempRider) {
    await s.from('event_riders').insert({ event_id: FECHA2_ID, rider_id: tempRider.id, category_at_event: 'Novicios Varones', club_at_event: 'TEST' });
    const { error } = await s.from('event_riders').update({ dorsal: 1 }).eq('rider_id', tempRider.id).eq('event_id', FECHA2_ID);
    if (error && error.code === '23505') {
      console.log('  ✓ La DB RECHAZA dorsales duplicados (constraint único activo en dorsal+event)');
    } else if (error) {
      console.log('  ? Error al probar:', error.message);
    } else {
      console.log('  ⚠️  La DB PERMITE dorsales duplicados — no hay constraint único en dorsal+event_id');
      console.log('     La unicidad la gestiona solo la app, no la DB. Riesgo si se edita directo en Supabase.');
    }
    // Limpiar
    await s.from('event_riders').delete().eq('rider_id', tempRider.id);
    await s.from('riders').delete().eq('id', tempRider.id);
    console.log('  (rider temporal eliminado)');
  }

  console.log('\n=== FIN DE AUDITORÍA ===');
}
run();
