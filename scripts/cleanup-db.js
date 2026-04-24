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

// Mapeo Maestro de ORIGINAL -> CLEAN
const MAPPING = {
  'Novicios Open': 'Novicios Varones',
  'Novicias Open': 'Novicias Damas',
  'Elite Open': 'Elite',
  'Enduro Open Mixto': 'Enduro Mixto',
  'E-Bike Open Mixto': 'EBike Mixto',
  'Enduro Mixto Open': 'Enduro Mixto',
  'EBike Mixto Open': 'EBike Mixto',
  'Varones Master A (30 a 39 Años)': 'Master A',
  'Varones Master B (40 a 49 Años)': 'Master B',
  'Varones Master C (50 a 59 Años)': 'Master C',
  'Varones Master D (60 y mas Años)': 'Master D',
  'Varones Elite Open': 'Elite',
  'Damas Pre Master (16 a 29 Años)': 'Damas Pre Master',
  'Damas Master A (30 a 39 Años)': 'Damas Master A',
  'Damas Master B (40 a 49 Años)': 'Damas Master B',
  'Damas Master C (50 Años y Mas)': 'Damas Master C',
};

async function totalCleanup() {
  console.log('--- REINICIANDO LIMPIEZA TOTAL ---');
  
  for (const [oldName, newName] of Object.entries(MAPPING)) {
    console.log(`Corrigiendo: [${oldName}] -> [${newName}]`);
    
    await supabase.from('riders').update({ category: newName }).eq('category', oldName);
    await supabase.from('event_riders').update({ category_at_event: newName }).eq('category_at_event', oldName);
    await supabase.from('results').update({ category_played: newName }).eq('category_played', oldName);
  }
  
  // Limpieza adicional de espacios o nulos
  await supabase.from('riders').update({ category: 'Novicios Varones' }).is('category', null);
  
  console.log('--- LIMPIEZA FINALIZADA ---');
}

totalCleanup();
