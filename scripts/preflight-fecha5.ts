import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function runPreflight() {
  console.log('=== INICIANDO PREFLIGHT FECHA 5 ===\n');

  let casesToReview = 0;
  const issues: string[] = [];

  // 1. Fetch Events
  const { data: events, error: evError } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (evError) {
    console.error('Error al cargar eventos', evError);
    return;
  }
  
  if (events.length < 5) {
    issues.push('❌ No existe la Fecha 5 en la base de datos.');
    casesToReview++;
  } else {
    const fecha5 = events[4];
    if (fecha5.status === 'completed') {
      issues.push(`⚠️ Fecha 5 (${fecha5.name}) está marcada como "completed". Debería estar en "active" o "scheduled" antes de la carrera.`);
      casesToReview++;
    }

    // Load event riders
    const { data: eventRiders } = await supabase.from('event_riders').select('*').eq('event_id', fecha5.id);
    const { data: results } = await supabase.from('results').select('*').eq('event_id', fecha5.id);

    // 2. Dorsales duplicados en Fecha 5
    const dorsals = new Set();
    const duplicateDorsals = new Set();
    eventRiders?.forEach(er => {
      if (er.dorsal) {
        if (dorsals.has(er.dorsal)) duplicateDorsals.add(er.dorsal);
        dorsals.add(er.dorsal);
      }
    });
    if (duplicateDorsals.size > 0) {
      issues.push(`⚠️ Dorsales duplicados detectados en Fecha 5: ${Array.from(duplicateDorsals).join(', ')}`);
      casesToReview += duplicateDorsals.size;
    }

    // 3. Corredores duplicados en Fecha 5
    const ridersInEvent = new Set();
    const duplicateRidersInEvent = new Set();
    eventRiders?.forEach(er => {
      if (ridersInEvent.has(er.rider_id)) duplicateRidersInEvent.add(er.rider_id);
      ridersInEvent.add(er.rider_id);
    });
    if (duplicateRidersInEvent.size > 0) {
      issues.push(`⚠️ Corredores duplicados en Fecha 5 (riders_id): ${duplicateRidersInEvent.size}`);
      casesToReview += duplicateRidersInEvent.size;
    }

    // 4. Categorías anómalas en Fecha 5
    const validCategories = [
      'Elite', 'Novicios Varones', 'Novicias Damas', 'Amateur', 'Master A', 'Master B', 
      'Master C', 'Master D', 'Master Damas', 'Damas Master A', 'Damas Master B', 
      'Damas Master C', 'E-Bike', 'EBike Mixto', 'Infantil', 'Juvenil', 'Cadete', 
      'Amateur Damas', 'Junior', 'Pre Master Mixto', 'Enduro Mixto'
    ];
    const invalidCats = new Set();
    eventRiders?.forEach(er => {
      if (!validCategories.some(c => c.toLowerCase() === er.category_at_event.toLowerCase())) {
        invalidCats.add(er.category_at_event);
      }
    });
    if (invalidCats.size > 0) {
      issues.push(`⚠️ Categorías sospechosas/no estándar en Fecha 5: ${Array.from(invalidCats).join(', ')}`);
      casesToReview += invalidCats.size;
    }

    // 5. Resultados ya existentes en Fecha 5 accidentalmente
    if (results && results.length > 0) {
      issues.push(`⚠️ Fecha 5 ya tiene ${results.length} resultados guardados. Revisar si son pruebas. (¡Podría corromper importación si no se limpian!)`);
      casesToReview++;
    }
  }

  // 6. Event Riders Huérfanos (en general)
  const { data: allER } = await supabase.from('event_riders').select('rider_id');
  const { data: allRiders } = await supabase.from('riders').select('id');
  const allRiderIds = new Set(allRiders?.map(r => r.id));
  const orphans = allER?.filter(er => !allRiderIds.has(er.rider_id));
  if (orphans && orphans.length > 0) {
    issues.push(`⚠️ Hay ${orphans.length} registros en event_riders que apuntan a riders que no existen (Huérfanos).`);
    casesToReview += orphans.length;
  }

  if (casesToReview === 0) {
    console.log('FECHA 5: LISTA ✅');
  } else {
    console.log(`FECHA 5: REVISAR ${casesToReview} CASOS ⚠️\n`);
    issues.forEach(iss => console.log(iss));
  }
}

runPreflight().catch(console.error);
