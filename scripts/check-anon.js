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

const anonClient = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  console.log('Checking if ANON key can see riders table...');
  const { data, error } = await anonClient.from('riders').select('full_name').limit(1);
  if (error) {
    console.error('ANON KEY FAILED:', error.message);
    if (error.message.includes('schema cache')) {
      console.log('Relationship error confirmed for anon key.');
    }
  } else {
    console.log('ANON KEY SUCCESS. Data found:', data.length);
  }

  console.log('\nChecking joint query with anon key...');
  const { error: joinError } = await anonClient.from('event_riders').select('id, riders(full_name)').limit(1);
  if (joinError) {
    console.error('ANON JOIN FAILED:', joinError.message);
  } else {
    console.log('ANON JOIN SUCCESS.');
  }
}
check();
