
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDates() {
  const { data: riders, error: rError } = await supabase
    .from('riders')
    .select('id, full_name')
    .or('full_name.ilike.%Cristian%,full_name.ilike.%Emanuel%');

  if (rError) {
    console.error(rError);
    return;
  }

  console.log('--- Corredores Encontrados ---');
  riders.forEach(r => console.log(`ID: ${r.id} | Nombre: ${r.full_name}`));

  const riderIds = riders.map(r => r.id);

  const { data: results, error: resError } = await supabase
    .from('results')
    .select('rider_id, points, position, events(name, date)')
    .in('rider_id', riderIds);

  if (resError) {
    console.error(resError);
    return;
  }

  console.log('\n--- Historial de Competición ---');
  results.forEach(res => {
    const rider = riders.find(r => r.id === res.rider_id);
    if (res.events) {
       console.log(`${rider.full_name} | Evento: ${res.events.name} | Fecha: ${res.events.date} | Pos: ${res.position} | Pts: ${res.points}`);
    }
  });
}

checkDates();
