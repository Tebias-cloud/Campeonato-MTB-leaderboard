const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});

// Test con cliente ANON (el que usa saveRider)
const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
// Test con service role
const adminClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const testRider = {
  full_name: 'TEST RIDER PRUEBA',
  rut: '99.999.999-9',
  category: 'Novicios Varones',
  club: 'INDEPENDIENTE / LIBRE',
  ciudad: 'IQUIQUE',
  email: 'test@prueba.cl',
  phone: '+56 9 1234 5678',
  instagram: null,
  birth_date: '1990-01-01',
};

async function run() {
  console.log('=== Test INSERT con cliente ANON ===');
  const { data: d1, error: e1 } = await anonClient.from('riders').insert(testRider).select('id').single();
  if (e1) console.log('ANON ERROR:', e1.code, e1.message);
  else console.log('ANON OK - ID:', d1.id);

  console.log('\n=== Test INSERT con SERVICE ROLE ===');
  const { data: d2, error: e2 } = await adminClient.from('riders').insert({...testRider, rut: '88.888.888-8'}).select('id').single();
  if (e2) console.log('ADMIN ERROR:', e2.code, e2.message);
  else {
    console.log('ADMIN OK - ID:', d2.id);
    // Limpiamos el test
    await adminClient.from('riders').delete().eq('id', d2.id);
    console.log('Test rider limpiado.');
  }

  // Limpiar el primero si se creó
  if (d1) {
    await adminClient.from('riders').delete().eq('id', d1.id);
    console.log('Test rider anon limpiado.');
  }
}
run();
