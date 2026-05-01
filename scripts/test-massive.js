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
  const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // Fecha 2
  const category = 'Master A';
  
  console.log(`Testing massive assignment for ${category} in ${eventId}...`);
  
  const { data: participants } = await s
    .from('event_riders')
    .select('*, riders!rider_id(full_name)')
    .eq('event_id', eventId)
    .eq('category_at_event', category);

  if (!participants || participants.length === 0) {
    console.log('No participants found.');
    return;
  }

  const finalUpdates = participants.map((p, i) => {
    const cleanP = { ...p };
    delete cleanP.riders; // Use delete instead of undefined
    return {
      ...cleanP,
      dorsal: 100 + i
    };
  });

  console.log(`Attempting upsert of ${finalUpdates.length} rows...`);
  const { error } = await s
    .from('event_riders')
    .upsert(finalUpdates, { onConflict: 'event_id, rider_id' });

  if (error) {
    console.error('Upsert FAILED:', error);
  } else {
    console.log('Upsert SUCCEEDED.');
    // Check if they are there
    const { data: verify } = await s.from('event_riders').select('dorsal').eq('event_id', eventId).not('dorsal', 'is', null);
    console.log(`Verified: ${verify.length} rows have dorsals now.`);
  }
}
test();
