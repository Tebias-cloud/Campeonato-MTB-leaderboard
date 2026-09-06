const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const actual = 'RIDER DESERT';
  const canonical = 'TEAM DESERT RIDER';
  let modifiedRiders = 0;
  let modifiedEventRiders = 0;

  // riders
  const { data: riders } = await supabase.from('riders').select('id, club');
  const ridersToUpdate = riders.filter(r => r.club && r.club.trim().toUpperCase() === actual);
  for (const r of ridersToUpdate) {
      await supabase.from('riders').update({ club: canonical }).eq('id', r.id);
      modifiedRiders++;
  }

  // event_riders
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event');
  const erToUpdate = eventRiders.filter(er => er.club_at_event && er.club_at_event.trim().toUpperCase() === actual);
  for (const er of erToUpdate) {
      await supabase.from('event_riders').update({ club_at_event: canonical })
            .eq('rider_id', er.rider_id).eq('event_id', er.event_id);
      modifiedEventRiders++;
  }

  console.log(`Filas riders modificadas: ${modifiedRiders}`);
  console.log(`Filas event_riders modificadas: ${modifiedEventRiders}`);
}

run();
