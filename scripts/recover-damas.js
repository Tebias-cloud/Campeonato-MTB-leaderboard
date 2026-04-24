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

// Mapeos QUIRÚRGICOS para separar lo que se mezcló
const RECOVERY = {
  '%Damas Master A%': 'Damas Master A',
  '%Damas Master B%': 'Damas Master B',
  '%Damas Master C%': 'Damas Master C',
  '%Pre Master%': 'Pre Master', // Se queda para varones
  '%Damas Pre Master%': 'Damas Pre Master',
  '%Novicias%': 'Novicias Damas',
  '%Novicios%': 'Novicios Varones',
};

async function recover() {
  console.log('--- INICIANDO RECUPERACIÓN DE DAMAS ---');
  
  // Primero arreglamos los que tienen el nombre largo todavía
  for (const [pattern, newName] of Object.entries(RECOVERY)) {
    console.log(`Restaurando: [${pattern}] -> [${newName}]`);
    await supabase.from('riders').update({ category: newName }).ilike('category', pattern);
    await supabase.from('event_riders').update({ category_at_event: newName }).ilike('category_at_event', pattern);
    await supabase.from('results').update({ category_played: newName }).ilike('category_played', pattern);
  }

  // Casos de limpieza de "Open (Recién empezando)" que vimos en el escaneo
  await supabase.from('riders').update({ category: 'Novicios Varones' }).ilike('category', '%Novicios%Open%');
  await supabase.from('riders').update({ category: 'Novicias Damas' }).ilike('category', '%Novicias%Open%');
  await supabase.from('riders').update({ category: 'Enduro Mixto' }).ilike('category', '%Enduro%Open%');

  console.log('--- RECUPERACIÓN COMPLETADA ---');
}

recover();
