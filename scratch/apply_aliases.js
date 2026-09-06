const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const changes = [
  { actual: 'CYCLES FRANKLIN', canonical: 'TEAM CYCLES FRANKLIN' },
  { actual: 'DELFIN MTB', canonical: 'TEAM DELFIN' },
  { actual: 'COBRA LINCH MTB', canonical: 'COBRALINCH MTB' },
  { actual: 'DESERT RIDER', canonical: 'TEAM DESERT RIDER' },
  { actual: 'RIDER DESERT CALAMA', canonical: 'RIDER DESERT' }
];

async function run() {
  let modifiedRiders = 0;
  let modifiedEventRiders = 0;

  for (const c of changes) {
    // We need to fetch rows matching exactly the actual string when trimmed and uppercased
    // riders
    const { data: riders } = await supabase.from('riders').select('id, club');
    const ridersToUpdate = riders.filter(r => r.club && r.club.trim().toUpperCase() === c.actual);
    for (const r of ridersToUpdate) {
        await supabase.from('riders').update({ club: c.canonical }).eq('id', r.id);
        modifiedRiders++;
    }

    // event_riders
    const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event');
    const erToUpdate = eventRiders.filter(er => er.club_at_event && er.club_at_event.trim().toUpperCase() === c.actual);
    for (const er of erToUpdate) {
        await supabase.from('event_riders').update({ club_at_event: c.canonical })
              .eq('rider_id', er.rider_id).eq('event_id', er.event_id);
        modifiedEventRiders++;
    }
  }

  console.log(`Filas riders modificadas: ${modifiedRiders}`);
  console.log(`Filas event_riders modificadas: ${modifiedEventRiders}`);
}

run();
