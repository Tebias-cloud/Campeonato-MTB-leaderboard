const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Simular lo que hace saveRider: env vacío de categoría (el bug sospechoso)
async function run() {
  // 1. Simular el bug: categoría vacía llega como string vacío al normalizeCategory
  const emptyCategory = '';
  console.log('Categoría vacía normalizada:', emptyCategory || '(vacía)');

  // 2. Crear rider de prueba legítimo
  const rider = {
    full_name: 'RIDER PRUEBA ADMIN',
    rut: '11.111.111-1',
    category: 'Master A',
    club: 'CHASKI RIDERS',
    ciudad: 'IQUIQUE',
    email: 'pruebaadmin@test.cl',
    phone: '+56 9 0000 0001',
    instagram: null,
    birth_date: '1988-06-15',
  };

  // Verificar que no existe
  const { data: existing } = await admin.from('riders').select('id').eq('rut', rider.rut).maybeSingle();
  if (existing) {
    console.log('Rider de prueba ya existe con ID:', existing.id);
    return;
  }

  const { data, error } = await admin.from('riders').insert(rider).select('id').single();
  if (error) {
    console.error('Error creando rider de prueba:', error.message);
    return;
  }

  console.log('Rider de prueba creado con ID:', data.id);

  // Inscribirlo a la próxima fecha (2ª Fecha - Club Chaski, 2026-05-03)
  const FECHA2_ID = '08927adb-29eb-41bc-9376-478ad41a40bc';
  const { error: e2 } = await admin.from('event_riders').insert({
    event_id: FECHA2_ID,
    rider_id: data.id,
    category_at_event: rider.category,
    club_at_event: rider.club
  });
  if (e2) console.log('Error inscribiendo:', e2.message);
  else console.log('Inscrito en Fecha 2 correctamente.');

  console.log('\n=== RIDER DE PRUEBA LISTO ===');
  console.log('Nombre: RIDER PRUEBA ADMIN');
  console.log('RUT: 11.111.111-1');
  console.log('Cat: Master A | Club: CHASKI RIDERS');
  console.log('Puedes eliminarlo desde el admin para probar el flujo completo.');
}
run();
