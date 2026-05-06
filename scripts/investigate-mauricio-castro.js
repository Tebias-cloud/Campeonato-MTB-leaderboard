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

async function investigate() {
  console.log("--- INVESTIGANDO A MAURICIO CASTRO ---");
  
  // 1. Buscar en la tabla de corredores (riders)
  const { data: riders } = await supabase.from('riders').select('*').ilike('full_name', '%MAURICIO%CASTRO%');
  
  if (!riders || riders.length === 0) {
    console.log("No se encontró a nadie con el nombre Mauricio Castro en la tabla 'riders'.");
  } else {
    for (const r of riders) {
      console.log(`\nCorredor: ${r.full_name} (ID: ${r.id})`);
      
      // 2. Buscar en las inscripciones (registrations)
      const { data: regs } = await supabase.from('registrations').select('*, events(name)').eq('rider_id', r.id);
      
      if (!regs || regs.length === 0) {
        console.log("- No tiene inscripciones confirmadas en 'registrations'.");
      } else {
        regs.forEach(reg => {
          console.log(`- Inscrito en: ${reg.events ? reg.events.name : 'Evento desconocido'} | Dorsal: ${reg.dorsal || 'SIN ASIGNAR'} | Status: ${reg.status}`);
        });
      }

      // 3. Buscar en solicitudes (registration_requests)
      const { data: requests } = await supabase.from('registration_requests').select('*').eq('full_name', r.full_name);
      if (requests && requests.length > 0) {
        console.log("- Solicitudes encontradas:");
        requests.forEach(req => {
          console.log(`  * Status: ${req.status} | Dorsal sugerido: ${req.dorsal || 'Ninguno'} | Evento ID: ${req.event_id}`);
        });
      }
    }
  }

  // Búsqueda general en solicitudes por si el nombre varía un poco
  const { data: allReqs } = await supabase.from('registration_requests').select('*').ilike('full_name', '%MAURICIO%CASTRO%');
  if (allReqs && allReqs.length > 0) {
    console.log("\nOtras solicitudes bajo este nombre:");
    allReqs.forEach(req => {
      console.log(`- ${req.full_name} | Status: ${req.status} | Dorsal: ${req.dorsal || 'N/A'}`);
    });
  }
}

investigate();
