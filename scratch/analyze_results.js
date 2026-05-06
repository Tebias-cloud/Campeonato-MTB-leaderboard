
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeResults() {
  // 1. Obtener el evento de la 2ª fecha
  const { data: events } = await supabase.from('events').select('*').ilike('name', '%2ª Fecha%');
  if (!events || events.length === 0) {
    console.log('No se encontró el evento de la 2ª fecha');
    return;
  }
  const event = events[0];
  console.log(`Analizando Evento: ${event.name} (ID: ${event.id})`);

  // 2. Obtener todos los resultados de este evento
  const { data: results } = await supabase
    .from('results')
    .select('rider_id, points, position, category_played, race_time, riders(full_name, rut)')
    .eq('event_id', event.id);

  console.log(`Total de resultados en DB para este evento: ${results.length}`);

  // 3. Obtener todos los inscritos para este evento (event_riders)
  const { data: eventRiders } = await supabase
    .from('event_riders')
    .select('dorsal, rider_id, riders(full_name)')
    .eq('event_id', event.id);

  console.log(`Total de inscritos (event_riders) en DB: ${eventRiders.length}`);

  // Listar dorsales cargados
  const loadedDorsals = results.map(r => {
    const er = eventRiders.find(er => er.rider_id === r.rider_id);
    return er ? er.dorsal : 'Desconocido';
  });

  console.log('\nDorsales con resultados cargados:', loadedDorsals.sort((a,b) => a-b).join(', '));
}

analyzeResults();
