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

async function scanDeep() {
  console.log('--- BUSCANDO DAMAS PERDIDAS EN EL BOSQUE DE LOS VARONES ---');
  
  const { data: riders } = await supabase.from('riders').select('full_name, category');
  
  // Categorías que sospechamos que se mezclaron
  const suspiciousCats = ['Master A', 'Master B', 'Master C', 'Pre Master', 'Elite', 'Enduro Mixto'];

  const results = riders.filter(r => {
    const isSuspicious = suspiciousCats.includes(r.category);
    const hasFemaleName = r.full_name.match(/(MARIA|CLAUDIA|ANDREA|PATRICIA|ANA|PAULA|ESTER|CONSTANZA|NINET|LAURA|MONICA|SANDRA|SILVIA|KARINA|YESSICA|MARCELA|VANESSA)/i);
    
    return isSuspicious && hasFemaleName;
  });

  console.log(results);
  console.log(`Total sospechosas encontradas: ${results.length}`);
}

scanDeep();
