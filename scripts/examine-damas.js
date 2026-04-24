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

async function examine() {
  console.log('--- INSPECCIÓN DE DATOS PARA RECUPERACIÓN ---');
  
  // 1. Ver qué rider tienen RUTs que coinciden con solicitudes de damas
  const { data: requests } = await supabase.from('registration_requests').select('rut, category');
  const ladyRuts = requests.filter(r => r.category.includes('Damas')).map(r => r.rut);
  
  // 2. Buscar esos riders y ver qué categoría tienen actualmente
  const { data: riders } = await supabase.from('riders').select('id, full_name, rut, category');
  
  console.log('--- DAMAS IDENTIFICADAS POR SOLICITUD ---');
  riders.forEach(r => {
    // Limpiamos los RUTs para comparar (quitar puntos y guiones)
    const cleanRut = r.rut.replace(/[\.-]/g, '');
    const isLadyRequest = ladyRuts.some(lr => lr.replace(/[\.-]/g, '') === cleanRut);
    
    if (isLadyRequest) {
      console.log(`Rider: ${r.full_name} | RUT: ${r.rut} | Categoría Actual: ${r.category}`);
    }
  });

  console.log('--- FIN DE INSPECCIÓN ---');
}

examine();
