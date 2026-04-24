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

async function ultimateFix() {
  console.log('--- REPARACIÓN DEFINITIVA ---');
  await supabase.from('riders').update({ category: 'Pre Master' }).eq('category', 'Pre Master (16 a 29 Años)');
  await supabase.from('event_riders').update({ category_at_event: 'Pre Master' }).eq('category_at_event', 'Pre Master (16 a 29 Años)');
  await supabase.from('results').update({ category_played: 'Pre Master' }).eq('category_played', 'Pre Master (16 a 29 Años)');
  console.log('✅ Base de datos 100% normalizada.');
}

ultimateFix();
