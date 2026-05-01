const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  const envPath2 = path.join(__dirname, '..', '.env');
  envContent = fs.readFileSync(envPath2, 'utf8');
}
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkEvents() {
  const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (error) console.error(error);
  else console.log(data);
}
checkEvents();
