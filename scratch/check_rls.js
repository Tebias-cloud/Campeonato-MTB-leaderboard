const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

const anonClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testRLS() {
  console.log('Testing what tables ANON client can modify:');
  
  // 1. Try to insert fake event
  const { data: evInsert, error: evErr } = await anonClient.from('events').insert({
    name: 'TEST EVENT RLS',
    date: '2026-12-31',
    status: 'scheduled'
  }).select();
  console.log('Events Insert:', evErr ? `❌ BLOCKED (${evErr.code}: ${evErr.message})` : `⚠️ PERMITTED (ID: ${evInsert[0]?.id})`);
  if (evInsert?.[0]?.id) {
    await anonClient.from('events').delete().eq('id', evInsert[0].id);
  }

  // 2. Try to insert fake result
  const { data: resInsert, error: resErr } = await anonClient.from('results').insert({
    event_id: '04772623-90d4-4bc7-b98f-6f4f79386330', // real event
    rider_id: '4dc81830-6b6a-4b15-bd91-bf571daf2f76', // real rider
    position: 99,
    points: 1,
    category_played: 'Elite'
  }).select();
  console.log('Results Insert:', resErr ? `❌ BLOCKED (${resErr.code}: ${resErr.message})` : `⚠️ PERMITTED`);
  if (resInsert) {
    // try to delete it
    await anonClient.from('results').delete().eq('event_id', '04772623-90d4-4bc7-b98f-6f4f79386330').eq('rider_id', '4dc81830-6b6a-4b15-bd91-bf571daf2f76');
  }

  // 3. Try to insert event_rider
  const { data: erInsert, error: erErr } = await anonClient.from('event_riders').insert({
    event_id: '04772623-90d4-4bc7-b98f-6f4f79386330',
    rider_id: '4dc81830-6b6a-4b15-bd91-bf571daf2f76',
    dorsal: 999,
    category_at_event: 'Elite'
  }).select();
  console.log('Event_Riders Insert:', erErr ? `❌ BLOCKED (${erErr.code}: ${erErr.message})` : `⚠️ PERMITTED`);
  if (erInsert) {
    await anonClient.from('event_riders').delete().eq('event_id', '04772623-90d4-4bc7-b98f-6f4f79386330').eq('rider_id', '4dc81830-6b6a-4b15-bd91-bf571daf2f76');
  }

  // 4. Try to insert registration request
  const { data: regInsert, error: regErr } = await anonClient.from('registration_requests').insert({
    full_name: 'TEST RLS REG',
    rut: '11.111.111-1',
    email: 'rls@test.cl',
    category: 'Elite',
    phone: '+56999999999',
    terms_accepted: true,
    status: 'pending'
  }).select();
  console.log('Registration Requests Insert:', regErr ? `❌ BLOCKED (${regErr.code}: ${regErr.message})` : `⚠️ PERMITTED (ID: ${regInsert[0]?.id})`);
  if (regInsert?.[0]?.id) {
    await anonClient.from('registration_requests').delete().eq('id', regInsert[0].id);
  }
}

testRLS();
