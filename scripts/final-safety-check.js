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

async function finalSafetyCheck() {
  console.log('--- CHEQUEO DE SEGURIDAD FINAL ---');

  // 1. Verificar solicitudes APROBADAS que no tienen inscripción
  console.log('\n1. Buscando solicitudes aprobadas sin inscripción en evento...');
  const { data: requests } = await supabase
    .from('registration_requests')
    .select('*')
    .eq('status', 'approved');

  const { data: eventRiders } = await supabase
    .from('event_riders')
    .select('event_id, rider_id, riders(rut)');

  let missingApproved = 0;
  for (const req of requests) {
    // Buscar si este rider (por RUT) está inscrito en el evento de la solicitud
    const isInscribed = eventRiders.some(er => 
      er.event_id === req.event_id && er.riders?.rut === req.rut
    );

    if (!isInscribed) {
      console.log(`⚠️ Solicitud aprobada FALTANTE: ${req.full_name} (${req.rut}) para Evento ID: ${req.event_id}`);
      missingApproved++;
    }
  }

  if (missingApproved === 0) {
    console.log('✅ Todas las solicitudes aprobadas tienen su inscripción correspondiente.');
  } else {
    console.log(`❌ Se encontraron ${missingApproved} discrepancias entre solicitudes y inscripciones.`);
  }

  // 2. Verificar duplicados de RUT en la tabla riders
  console.log('\n2. Buscando RUTs duplicados en la tabla general de riders...');
  const { data: allRiders } = await supabase.from('riders').select('rut');
  const ruts = allRiders.map(r => r.rut);
  const uniqueRuts = new Set(ruts);
  if (ruts.length !== uniqueRuts.size) {
    console.log(`⚠️ Alerta: Hay ${ruts.length - uniqueRuts.size} RUTs duplicados en la tabla de riders.`);
  } else {
    console.log('✅ No hay RUTs duplicados en la tabla general.');
  }

  console.log('\n--- FIN DEL CHEQUEO ---');
}

finalSafetyCheck();
