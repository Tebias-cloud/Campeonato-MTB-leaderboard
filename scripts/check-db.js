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
  const { data: row } = await s.from('event_riders').select('*').limit(1).single();
  if (!row) { console.log('No rows found'); return; }

  console.log('Testing upsert on existing row:', row.id);
  const testData = { ...row, dorsal: 999 };
  
  // Test 1: Upsert with PK
  console.log('Test 1: Upsert with PK (id)...');
  const { error: err1 } = await s.from('event_riders').upsert(testData);
  if (err1) console.log('FAILED:', err1.message);
  else console.log('SUCCESS');

  // Test 2: Upsert with event_id, rider_id
  console.log('Test 2: Upsert with onConflict event_id, rider_id...');
  const testData2 = { ...row, id: undefined, dorsal: 888 }; // Remove PK to force conflict on secondary keys
  const { error: err2 } = await s.from('event_riders').upsert(testData2, { onConflict: 'event_id, rider_id' });
  if (err2) console.log('FAILED:', err2.message);
  else console.log('SUCCESS');

  // Cleanup
  await s.from('event_riders').update({ dorsal: row.dorsal }).eq('id', row.id);
}
check();
