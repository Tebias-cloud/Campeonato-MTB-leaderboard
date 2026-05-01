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

async function meticulousAudit() {
  console.log('=== INICIANDO AUDITORÍA MINUCIOSA DEL SISTEMA ===\n');

  // 1. Verificar Duplicados en event_riders (Mismo corredor, mismo evento)
  console.log('--- 1. Buscando inscripciones duplicadas ---');
  const { data: allEventRiders, error: erError } = await supabase
    .from('event_riders')
    .select('id, event_id, rider_id, riders(full_name, rut)');

  if (erError) console.error('Error al obtener event_riders:', erError);
  else {
    const seen = new Set();
    const dups = [];
    allEventRiders.forEach(er => {
      const key = `${er.event_id}-${er.rider_id}`;
      if (seen.has(key)) {
        dups.push(er);
      } else {
        seen.add(key);
      }
    });
    if (dups.length > 0) {
      console.log(`⚠️ Se encontraron ${dups.length} inscripciones duplicadas:`);
      dups.forEach(d => console.log(`   - Rider: ${d.riders?.full_name} (${d.riders?.rut}), Evento ID: ${d.event_id}`));
    } else {
      console.log('✅ No hay inscripciones duplicadas (mismo rider en mismo evento).');
    }
  }

  // 2. Verificar Huérfanos
  console.log('\n--- 2. Buscando inscripciones huérfanas ---');
  const orphans = allEventRiders.filter(er => !er.riders);
  if (orphans.length > 0) {
    console.log(`⚠️ Se encontraron ${orphans.length} inscripciones que apuntan a riders que NO existen:`);
    orphans.forEach(o => console.log(`   - ID inscripción: ${o.id}, ID rider: ${o.rider_id}`));
  } else {
    console.log('✅ No hay inscripciones huérfanas.');
  }

  // 3. Verificar Riders sin Inscripción (Riders que existen pero no están en ningún evento)
  console.log('\n--- 3. Buscando corredores sin eventos inscritos ---');
  const { data: allRiders, error: rError } = await supabase
    .from('riders')
    .select('id, full_name, rut');
  
  if (rError) console.error('Error al obtener riders:', rError);
  else {
    const ridersWithEvents = new Set(allEventRiders.map(er => er.rider_id));
    const ridersWithoutEvents = allRiders.filter(r => !ridersWithEvents.has(r.id));
    if (ridersWithoutEvents.length > 0) {
      console.log(`ℹ️ Hay ${ridersWithoutEvents.length} corredores registrados en la BD general pero no inscritos en ningún evento:`);
      // Mostramos los primeros 10 para no saturar
      ridersWithoutEvents.slice(0, 10).forEach(r => console.log(`   - ${r.full_name} (${r.rut})`));
      if (ridersWithoutEvents.length > 10) console.log('   ... y otros mas.');
    } else {
      console.log('✅ Todos los corredores están inscritos en al menos un evento.');
    }
  }

  // 4. Verificar Dorsales en la 2ª Fecha
  console.log('\n--- 4. Verificando dorsales (bib numbers) en la 2ª Fecha ---');
  const eventId2 = '08927adb-29eb-41bc-9376-478ad41a40bc';
  const { data: event2Riders } = await supabase
    .from('event_riders')
    .select('dorsal, riders(full_name, rut)')
    .eq('event_id', eventId2);
  
  const withoutDorsal = event2Riders?.filter(er => !er.dorsal || er.dorsal === 'S/D');
  if (withoutDorsal?.length > 0) {
    console.log(`⚠️ Hay ${withoutDorsal.length} corredores sin dorsal asignado en la 2ª Fecha:`);
    withoutDorsal.slice(0, 5).forEach(er => console.log(`   - ${er.riders?.full_name} (${er.riders?.rut})`));
  } else {
    console.log('✅ Todos los corredores de la 2ª Fecha tienen dorsal.');
  }

  // 5. Verificar Categorías (Inconsistencias entre riders y event_riders si aplica)
  // Nota: En este sistema, la categoría suele estar en la tabla 'riders'.
  console.log('\n--- 5. Verificando consistencia de categorías ---');
  const { data: catAudit } = await supabase
    .from('riders')
    .select('full_name, category');
  
  const invalidCats = catAudit?.filter(r => !r.category || r.category === 'POR DEFINIR' || r.category === '-');
  if (invalidCats?.length > 0) {
    console.log(`⚠️ Hay ${invalidCats.length} corredores con categorías inválidas o por definir:`);
    invalidCats.slice(0, 5).forEach(r => console.log(`   - ${r.full_name}: ${r.category}`));
  } else {
    console.log('✅ Todos los corredores tienen una categoría válida asignada.');
  }

  console.log('\n=== FIN DE LA AUDITORÍA ===');
}

meticulousAudit();
