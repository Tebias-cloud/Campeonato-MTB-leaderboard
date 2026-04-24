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

async function finalReport() {
  console.log('--- INFORME DE TRANSPARENCIA PARA TU REVISIÓN ---');
  
  const { data: riders } = await supabase.from('riders').select('full_name, category').order('category');
  
  const report = riders.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r.full_name);
    return acc;
  }, {});

  for (const [cat, names] of Object.entries(report)) {
    console.log(`\n📂 CATEGORÍA: ${cat} (${names.length} corredores)`);
    console.log(`   Ejemplos: ${names.slice(0, 5).join(' | ')} ${names.length > 5 ? '...y más' : ''}`);
  }

  console.log('\n--- FIN DEL INFORME ---');
}

finalReport();
