const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envText = fs.readFileSync('.env.local', 'utf-8');
const supabaseUrl = envText.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/)?.[1] || '';
const supabaseKey = envText.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/)?.[1] || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const c1 = 'ENDURO MTB IQUIQUE';
  const c2 = 'ENDURO EMTB IQUIQUE 🍺🍻';

  const { data: riders } = await supabase.from('riders').select('id, full_name, club, category');
  const { data: eventRiders } = await supabase.from('event_riders').select('rider_id, event_id, club_at_event, category_at_event, riders(full_name)');
  
  // 1. ENDURO MTB IQUIQUE
  const r1 = riders.filter(r => r.club === c1);
  const er1 = eventRiders.filter(er => er.club_at_event === c1);
  const ids1 = new Set([...r1.map(r => r.id), ...er1.map(er => er.rider_id)]);
  
  // 2. ENDURO EMTB IQUIQUE 🍺🍻
  const r2 = riders.filter(r => r.club === c2);
  const er2 = eventRiders.filter(er => er.club_at_event === c2);
  const ids2 = new Set([...r2.map(r => r.id), ...er2.map(er => er.rider_id)]);
  
  // Overlap
  const overlap = [...ids1].filter(id => ids2.has(id));
  const overlapNames = overlap.map(id => riders.find(r => r.id === id)?.full_name);
  
  // E-Bike check
  const ebikeCount = er2.filter(er => er.category_at_event?.toLowerCase().includes('ebike')).length;
  
  // Confirm CYCLES FRANKLIN
  const franklinOld = riders.filter(r => r.club === 'CYCLES FRANKLIN');
  const franklinNew = riders.filter(r => r.club === 'TEAM CYCLES FRANKLIN');
  const franklinOldEr = eventRiders.filter(er => er.club_at_event === 'CYCLES FRANKLIN');
  
  // Confirm Fecha 5
  const { data: events } = await supabase.from('events').select('id, name, status').order('date', { ascending: true });
  const fecha5 = events[4];
  
  fs.writeFileSync('scratch/enduro_iquique_report.json', JSON.stringify({
      c1_counts: { riders: r1.length, eventRiders: er1.length },
      c2_counts: { riders: r2.length, eventRiders: er2.length },
      overlapCount: overlap.length,
      overlapNames,
      c2_ebike_events: ebikeCount,
      c2_events: er2.map(er => er.event_id),
      c1_events: er1.map(er => er.event_id),
      franklin_check: {
          riders_old: franklinOld.length,
          riders_new: franklinNew.length,
          er_old: franklinOldEr.length
      },
      fecha5_status: fecha5.status
  }, null, 2));

  console.log('Analysis complete');
}

run();
