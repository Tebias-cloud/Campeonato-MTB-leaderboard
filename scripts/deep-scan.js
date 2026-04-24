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

async function deepScan() {
  console.log('--- ESCANEO PROFUNDO DE CATEGORÍAS SUCIAS ---');
  
  // 1. Scan Riders
  const { data: riders } = await supabase.from('riders').select('id, full_name, category');
  const dirtyRiders = riders.filter(r => r.category.includes('(') || r.category.includes('Open'));
  
  if (dirtyRiders.length > 0) {
    console.log('\n[RIDERS ENCONTRADOS]');
    dirtyRiders.forEach(r => console.log(`- ${r.full_name} | Cat: ${r.category} | ID: ${r.id}`));
  }

  // 2. Scan Results
  const { data: results } = await supabase.from('results').select('id, category_played');
  const dirtyResults = results.filter(r => r.category_played.includes('(') || r.category_played.includes('Open'));
  
  if (dirtyResults.length > 0) {
    console.log('\n[RESULTADOS ENCONTRADOS]');
    dirtyResults.forEach(r => console.log(`- ID: ${r.id} | Cat: ${r.category_played}`));
  }

  // 3. Scan Event Riders
  const { data: er } = await supabase.from('event_riders').select('event_id, rider_id, category_at_event');
  const dirtyER = er.filter(r => r.category_at_event && (r.category_at_event.includes('(') || r.category_at_event.includes('Open')));
  
  if (dirtyER.length > 0) {
    console.log('\n[EVENT_RIDERS ENCONTRADOS]');
    dirtyER.forEach(r => console.log(`- Rider ID: ${r.rider_id} | Cat: ${r.category_at_event}`));
  }

  console.log('\n--- ESCANEO FINALIZADO ---');
}

deepScan();
