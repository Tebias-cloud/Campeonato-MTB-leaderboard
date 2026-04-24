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

async function finalPolish() {
  console.log('--- PULIDO FINAL DE NOMBRES ---');
  
  const FINAL_MAP = {
    'Novicios Open (Recién empezando)': 'Novicios Varones',
    'Novicias Open (Recién empezando)': 'Novicias Damas',
    'Enduro Open Mixto (Horquilla 140mm+)': 'Enduro Mixto',
  };

  for (const [oldName, newName] of Object.entries(FINAL_MAP)) {
    console.log(`Puliedo: [${oldName}] -> [${newName}]`);
    await supabase.from('riders').update({ category: newName }).eq('category', oldName);
    await supabase.from('event_riders').update({ category_at_event: newName }).eq('category_at_event', oldName);
    await supabase.from('results').update({ category_played: newName }).eq('category_played', oldName);
  }

  console.log('--- SISTEMA 100% LIMPIO ---');
}

finalPolish();
