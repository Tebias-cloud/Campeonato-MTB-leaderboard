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

async function rollback() {
  console.log('Fetching events...');
  const { data: events } = await s.from('events').select('id, name');
  console.log('Events:', events);

  console.log('\nDELETING ALL RESULTS...');
  const { error: resError } = await s.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (resError) console.error('Error results:', resError);
  else console.log('All results deleted.');

  console.log('\nCLEARING ALL DORSALS...');
  const { error: dorError } = await s.from('event_riders').update({ dorsal: null }).not('dorsal', 'is', null);
  if (dorError) console.error('Error dorsals:', dorError);
  else console.log('All dorsals cleared.');
}
rollback();
