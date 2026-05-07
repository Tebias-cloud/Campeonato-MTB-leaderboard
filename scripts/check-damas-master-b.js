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

async function check() {
  console.log("--- REVISANDO DAMAS MASTER B ---");
  
  // Revisar si hay corredores en esa categoría
  const { data: riders } = await supabase.from('riders').select('*').eq('category', 'Damas Master B');
  console.log(`Corredores en la categoría: ${riders.length}`);
  
  // Revisar resultados en esa categoría
  const { data: results } = await supabase.from('results').select('*, riders(full_name)').eq('category_played', 'Damas Master B');
  console.log(`Resultados registrados: ${results.length}`);
  
  if (results.length > 0) {
    results.forEach(r => {
      console.log(`- ${r.riders.full_name}: Posición ${r.position}, Puntos ${r.points}`);
    });
  } else {
    // Si no hay resultados, tal vez la categoría se llamaba distinto antes
    const { data: allResults } = await supabase.from('results').select('category_played').limit(100);
    const uniqueCats = Array.from(new Set(allResults.map(r => r.category_played)));
    console.log("Categorías con resultados actualmente en la DB:", uniqueCats);
  }
}

check();
