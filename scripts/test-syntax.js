const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
  });
}
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  console.log('Test 1: riders(full_name)');
  const r1 = await s.from('event_riders').select('riders(full_name)').limit(1);
  console.log('Result 1:', r1.error ? r1.error.message : 'Success');

  console.log('\nTest 2: rider:rider_id(full_name)');
  const r2 = await s.from('event_riders').select('rider:rider_id(full_name)').limit(1);
  console.log('Result 2:', r2.error ? r2.error.message : 'Success');

  console.log('\nTest 3: riders!rider_id(full_name)');
  const r3 = await s.from('event_riders').select('riders!rider_id(full_name)').limit(1);
  console.log('Result 3:', r3.error ? r3.error.message : 'Success');

  console.log('\nTest 4: rider:riders!rider_id(full_name)');
  const r4 = await s.from('event_riders').select('rider:riders!rider_id(full_name)').limit(1);
  console.log('Result 4:', r4.error ? r4.error.message : 'Success');
}
test();
