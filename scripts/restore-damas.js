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

async function restore() {
  console.log('--- INICIANDO RESTAURACIÓN QUIRÚRGICA DESDE REGISTRATION_REQUESTS ---');
  
  const { data: requests, error } = await supabase.from('registration_requests').select('rut, category');
  if (error) {
    console.error('Error al leer solicitudes:', error);
    return;
  }

  console.log(`Analizando ${requests.length} solicitudes...`);

  for (const req of requests) {
    const orig = req.category;
    let target = null;
    
    // Clasificación basada en el nombre original de la solicitud
    if (orig.includes('Damas')) {
      if (orig.includes('Master A')) target = 'Damas Master A';
      else if (orig.includes('Master B')) target = 'Damas Master B';
      else if (orig.includes('Master C')) target = 'Damas Master C';
      else if (orig.includes('Pre Master')) target = 'Damas Pre Master';
      else if (orig.includes('Novicia') || orig.includes('Novica')) target = 'Novicias Damas';
    }

    if (target) {
      console.log(`RUT ${req.rut}: [${orig}] -> Restaurando a [${target}]`);
      
      // 1. Corregir Rider
      const { data: rider } = await supabase.from('riders').update({ category: target }).eq('rut', req.rut).select('id').single();
      
      if (rider) {
        // 2. Corregir Participaciones
        await supabase.from('event_riders').update({ category_at_event: target }).eq('rider_id', rider.id);
        // 3. Corregir Resultados
        await supabase.from('results').update({ category_played: target }).eq('rider_id', rider.id);
      }
    }
  }

  console.log('--- RESTAURACIÓN FINALIZADA ---');
}

restore();
