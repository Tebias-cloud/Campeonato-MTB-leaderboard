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
  console.log("--- BUSCANDO A LA GANADORA DE DAMAS MASTER B ---");
  
  const { data: riders } = await supabase.from('riders').select('*').eq('category', 'Damas Master B');
  console.log(`Corredores registrados en la categoría: ${riders.length}`);
  
  for (const rider of riders) {
    const { data: results } = await supabase.from('results').select('*').eq('rider_id', rider.id);
    if (results.length > 0) {
      console.log(`- ${rider.full_name}: tiene resultados en la tabla results.`);
    } else {
      console.log(`- ${rider.full_name}: NO tiene resultados en la tabla results.`);
    }
  }

  // Buscar resultados que quizás tengan la categoría mal escrita o sean de la categoría antigua
  const { data: resultsMistake } = await supabase.from('results').select('*, riders(full_name)').ilike('category_played', '%Damas Master B%');
  console.log("\nResultados con categoría similar a 'Damas Master B':");
  resultsMistake.forEach(r => {
    console.log(`- ${r.riders.full_name}: Categoría en result: '${r.category_played}', Posición: ${r.position}`);
  });
}

check();
