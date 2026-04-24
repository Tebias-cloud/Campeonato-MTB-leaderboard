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

async function fix() {
  const { error } = await supabase
    .from('riders')
    .update({ category: 'Master B' })
    .eq('id', '73e40047-5e3f-4c28-8f45-66a1d4c6b1e9');
    
  if (error) console.error('Error:', error);
  else console.log('✅ Mauricio Gutierrez ha sido normalizado a Master B.');
}

fix();
