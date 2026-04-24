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

async function finalRescue() {
  console.log('--- OPERACIÓN RESCATE FINAL DESDE TABLA HISTÓRICA ---');
  
  // 1. Obtener todas las damas de la tabla histórica
  const { data: legacy, error } = await supabase.from('registrations').select('rut, category_selected');
  
  if (error) {
    console.error('Error al leer tabla histórica:', error);
    return;
  }

  console.log(`Analizando ${legacy.length} registros históricos...`);

  for (const reg of legacy) {
    const orig = reg.category_selected;
    if (!orig || !orig.includes('Damas')) continue;

    let target = null;
    if (orig.includes('Master A')) target = 'Damas Master A';
    else if (orig.includes('Master B')) target = 'Damas Master B';
    else if (orig.includes('Master C')) target = 'Damas Master C';
    else if (orig.includes('Pre Master')) target = 'Damas Pre Master';
    else if (orig.includes('Novicia') || orig.includes('Novica')) target = 'Novicias Damas';

    if (target) {
      console.log(`Rescatando RUT ${reg.rut}: -> ${target}`);
      
      // Actualizar en todas las tablas
      const { data: rider } = await supabase.from('riders').update({ category: target }).eq('rut', reg.rut).select('id').single();
      
      if (rider) {
        await supabase.from('event_riders').update({ category_at_event: target }).eq('rider_id', rider.id);
        await supabase.from('results').update({ category_played: target }).eq('rider_id', rider.id);
      }
    }
  }

  console.log('--- RESCATE COMPLETADO. TODAS LAS DAMAS DEBERÍAN SER VISIBLES ---');
}

finalRescue();
