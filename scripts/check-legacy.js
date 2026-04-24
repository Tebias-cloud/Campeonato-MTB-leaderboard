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

async function checkLegacy() {
  console.log('--- REVISANDO TABLA REGISTRATIONS (HISTÓRICO) ---');
  
  try {
    const { data, error } = await supabase.from('registrations').select('rut, category, full_name').limit(10);
    
    if (error) {
      console.log('❌ Error o Tabla no existe:', error.message);
    } else {
      console.log('✅ Datos encontrados:');
      console.log(data);
    }
  } catch (e) {
    console.log('❌ Error crítico:', e.message);
  }
}

checkLegacy();
