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
  console.log('Checking event_riders table for any dorsals...');
  const { data, error } = await s.from('event_riders').select('id, event_id, rider_id, dorsal').not('dorsal', 'is', null);
  if (error) { console.error(error); return; }
  
  console.log(`Found ${data.length} rows with dorsals in total.`);
  
  if (data.length > 0) {
    const eventCounts = {};
    data.forEach(d => {
        eventCounts[d.event_id] = (eventCounts[d.event_id] || 0) + 1;
    });
    console.log('Dorsals per event:', eventCounts);
    console.log('Sample row:', data[0]);
  }
}
check();
