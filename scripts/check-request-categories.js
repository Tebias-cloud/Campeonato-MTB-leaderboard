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

async function checkCategories() {
  const { data: requests, error } = await supabase
    .from('registration_requests')
    .select('id, category, full_name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log('--- CATEGORÍAS EN SOLICITUDES ---');
  requests.forEach(r => {
    console.log(`Rider: ${r.full_name} | Categoría DB: "${r.category}"`);
  });
}

checkCategories();
