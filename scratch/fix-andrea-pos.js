const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAndrea() {
  console.log("Esperando 5 segundos para asegurar que el guardado en la UI terminó...");
  await new Promise(r => setTimeout(r, 5000));

  // 1. Buscar el evento 1ª Fecha
  const { data: events } = await supabase.from('events').select('*').ilike('name', '%1ª Fecha%');
  if (!events || events.length === 0) return console.log('Evento no encontrado');
  const event = events[0];

  // 2. Buscar a Andrea Ramirez
  const { data: riders } = await supabase.from('riders').select('*').ilike('full_name', '%ANDREA RAMIREZ%');
  if (!riders || riders.length === 0) return console.log('Corredora no encontrada');
  const andrea = riders[0];

  // 3. Buscar y actualizar su resultado en Pre Master Mixto
  const { data: result, error: fetchErr } = await supabase
    .from('results')
    .select('*')
    .eq('event_id', event.id)
    .eq('rider_id', andrea.id)
    .single();

  if (fetchErr) {
    console.log('No se encontró su resultado (quizás no guardaste aún):', fetchErr.message);
    return;
  }

  console.log(`Resultado actual: Posición ${result.position}, Puntos ${result.points}`);
  
  // Puntos para 4to lugar: Si 1ro = 100, 2do = 90, 3ro = 80, 4to = 70.
  const newPoints = 70;

  const { error: updateErr } = await supabase
    .from('results')
    .update({ position: 4, points: newPoints })
    .eq('id', result.id);

  if (updateErr) {
    console.error('Error actualizando:', updateErr);
  } else {
    console.log('✅ Andrea Ramirez actualizada exitosamente a la Posición 4 con 70 puntos.');
  }
}

fixAndrea();
