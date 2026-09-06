const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const actual = 'ENDURO EMTB IQUIQUE 🍺🍻';
  const canonical = 'ENDURO MTB IQUIQUE';

  // 1. Update Riders
  const { data: riders } = await supabase.from('riders').select('id, club');
  const ridersToUpdate = riders.filter(r => r.club && r.club.trim().toUpperCase() === actual.toUpperCase());
  for (const r of ridersToUpdate) {
      await supabase.from('riders').update({ club: canonical }).eq('id', r.id);
  }

  // 2. Update Event Riders
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event');
  const erToUpdate = eventRiders.filter(er => er.club_at_event && er.club_at_event.trim().toUpperCase() === actual.toUpperCase());
  for (const er of erToUpdate) {
      await supabase.from('event_riders').update({ club_at_event: canonical })
            .eq('rider_id', er.rider_id).eq('event_id', er.event_id);
  }

  // 3. Update Event Status
  // Find Fecha 5
  const { data: events } = await supabase.from('events').select('id, name, status').order('date', { ascending: true });
  const fecha5 = events[4];
  if (fecha5) {
      await supabase.from('events').update({ status: 'pending' }).eq('id', fecha5.id);
      console.log(`Updated event ${fecha5.name} from ${fecha5.status} to pending`);
  }

  console.log(`Updated ${ridersToUpdate.length} riders and ${erToUpdate.length} event_riders`);
}

run();
