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

async function checkLegacyCols() {
  console.log('--- REVISANDO COLUMNAS REGISTRATIONS ---');
  const { data } = await supabase.from('registrations').select('*').limit(1);
  if (data && data.length > 0) {
    console.log(Object.keys(data[0]));
  } else {
    console.log('Tabla vacía o inaccesible');
  }
}

checkLegacyCols();
