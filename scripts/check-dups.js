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
  const { data: results, error } = await s.from('results').select('event_id, rider_id');
  if (error) {
    console.error(error);
    return;
  }
  const counts = {};
  results.forEach(x => {
    const key = `${x.event_id}-${x.rider_id}`;
    counts[key] = (counts[key] || 0) + 1;
  });
  const dups = Object.entries(counts).filter(([k, c]) => c > 1);
  if (dups.length > 0) {
    console.log('FOUND DUPLICATES:', dups);
  } else {
    console.log('NO DUPLICATES FOUND IN DB.');
  }
}
check();
