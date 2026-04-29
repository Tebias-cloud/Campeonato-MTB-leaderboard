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

async function fixRider() {
  const { data, error } = await supabase
    .from('riders')
    .update({ full_name: 'FRANCISCO JAVIER HUIDOBRO PEREZ' })
    .eq('rut', '12469080-3')
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Rider actualizado:', data);
  }
}

fixRider();
