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

const OFFICIAL = [
  'Novicios Varones', 'Elite', 'Pre Master', 'Master A', 'Master B', 'Master C', 'Master D',
  'Novicias Damas', 'Damas Pre Master', 'Damas Master A', 'Damas Master B', 'Damas Master C',
  'Enduro Mixto', 'EBike Mixto'
];

async function scan() {
  const { data } = await supabase.from('results').select('category_played');
  const unique = [...new Set(data.map(r => r.category_played))];
  const orphans = unique.filter(c => !OFFICIAL.includes(c));
  console.log('--- CATEGORÍAS ENCONTRADAS EN RESULTADOS ---');
  console.log(unique);
  console.log('--- CATEGORÍAS HUÉRFANAS (Que no coinciden con la web) ---');
  console.log(orphans);
}

scan();
