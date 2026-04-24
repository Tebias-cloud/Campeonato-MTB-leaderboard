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

async function fixAndInvestigate() {
  console.log('--- RECUPERANDO A ANDREA Y REVISANDO COLUMNAS ---');
  
  // Recuperar a Andrea
  await supabase.from('riders').update({ category: 'Damas Pre Master' }).ilike('full_name', '%ANDREA RAMIREZ%');
  console.log('✅ Andrea Ramirez restaurada a Damas Pre Master.');

  // Revisar columnas
  const { data } = await supabase.from('riders').select('*').limit(1);
  if (data && data.length > 0) {
    console.log('--- COLUMNAS DISPONIBLES EN RIDERS ---');
    console.log(Object.keys(data[0]));
  }
}

fixAndInvestigate();
