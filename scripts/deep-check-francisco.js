const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent;
try { envContent = fs.readFileSync(envPath, 'utf8'); }
catch (e) { envContent = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8'); }

const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function deepCheck() {
  const RUT = '13412713-9';
  const NAME = 'FRANCISCO DANIEL LINCHEO';
  const RIDER_ID = '9ddbd327-5ed8-4b39-8c83-c4f5b96f8298';

  console.log('=== VERIFICACIÓN COMPLETA FRANCISCO LINCHEO TORREJON ===\n');

  // 1. Tabla results (puntos oficiales)
  const { data: results } = await supabase
    .from('results')
    .select('*, events(name)')
    .eq('rider_id', RIDER_ID);
  console.log('📊 TABLA results (puntos oficiales):');
  if (!results || results.length === 0) {
    console.log('   → VACÍO: No tiene ningún resultado registrado en el sistema.');
  } else {
    results.forEach(r => console.log('   -', r));
  }

  // 2. Tabla registrations (respaldo de inscripciones aprobadas)
  const { data: regs } = await supabase
    .from('registrations')
    .select('*, events(name)')
    .eq('rut', RUT);
  console.log('\n📋 TABLA registrations (inscripciones aprobadas):');
  if (!regs || regs.length === 0) {
    console.log('   → VACÍO: No figura en el historial de inscripciones aprobadas.');
  } else {
    regs.forEach(r => console.log(`   - Evento: ${r.events?.name}, Status: ${r.status}, Categoría: ${r.category_selected}`));
  }

  // 3. Tabla registration_requests (¿tuvo solicitudes?)
  const { data: requests } = await supabase
    .from('registration_requests')
    .select('*, events(name)')
    .eq('rut', RUT);
  console.log('\n📝 TABLA registration_requests (solicitudes históricas):');
  if (!requests || requests.length === 0) {
    console.log('   → VACÍO: No queda ninguna solicitud en el historial.');
  } else {
    requests.forEach(r => console.log(`   - Evento: ${r.events?.name || r.event_id}, Status: ${r.status}`));
  }

  // 4. Verificar en el dump JSON local
  const dump = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'all_registrations_dump.json'), 'utf8'));
  const inDump = dump.filter(r => r.rut === RUT || (r.full_name && r.full_name.includes('LINCHEO')));
  console.log('\n💾 DUMP LOCAL all_registrations_dump.json:');
  if (inDump.length === 0) {
    console.log('   → No aparece en el dump de inscripciones.');
  } else {
    inDump.forEach(r => console.log(`   - Evento: ${r.event_id}, Status: ${r.status}, Categoría: ${r.category_selected}`));
  }

  console.log('\n=== CONCLUSIÓN ===');
  const tieneResultados = results && results.length > 0;
  const tieneInscripcionAprobada = regs && regs.length > 0;
  const estaEnDump = inDump.length > 0;

  if (!tieneResultados) {
    console.log('✅ No tiene puntos en la tabla oficial (results). Puedes fiarte de esto.');
  } else {
    console.log('⚠️  SÍ tiene resultados registrados. Revisar manualmente.');
  }

  if (!tieneInscripcionAprobada && !estaEnDump) {
    console.log('✅ Tampoco aparece en el historial de inscripciones aprobadas ni en el dump.');
    console.log('   → Conclusión: Solo estaba inscrito pero NO completó/fue registrado en la carrera.');
  } else {
    console.log('⚠️  Sí aparece en inscripciones. Detalles arriba.');
  }
}

deepCheck();
