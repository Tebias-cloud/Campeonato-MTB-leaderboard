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

async function check() {
  console.log('Detecting relationship name for event_riders -> riders...');
  
  // Try to find the relationship name via API error if needed, but first try a select
  const test1 = await s.from('event_riders').select('riders(id)').limit(1);
  console.log('Test riders(id):', test1.error ? test1.error.message : 'Success');

  const test2 = await s.from('event_riders').select('rider(id)').limit(1);
  console.log('Test rider(id):', test2.error ? test2.error.message : 'Success');
  
  const test3 = await s.from('event_riders').select('riders_rider_id_fkey(id)').limit(1);
  console.log('Test riders_rider_id_fkey(id):', test3.error ? test3.error.message : 'Success');
}
check();
