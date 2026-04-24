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

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function fix() {
  console.log('--- REPARANDO ASIGNACIONES DE EVENTOS ---');
  
  // 1. Encontrar el próximo evento
  const { data: event } = await supabase
    .from('events')
    .select('id, name')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .single();

  if (!event) {
    console.log('No hay eventos futuros registrados.');
    return;
  }

  console.log(`Próximo evento detectado: ${event.name}`);

  // 2. Encontrar riders sin participaciones
  const { data: allRiders } = await supabase.from('riders').select('id, full_name, category, club');
  const { data: participations } = await supabase.from('event_riders').select('rider_id');
  
  const participantsSet = new Set(participations.map(p => p.rider_id));
  const orphans = allRiders.filter(r => !participantsSet.has(r.id));

  console.log(`Encontrados ${orphans.length} corredores sin evento asignado.`);

  for (const rider of orphans) {
    console.log(`Asignando a ${rider.full_name} al evento ${event.name}`);
    await supabase.from('event_riders').upsert({
      event_id: event.id,
      rider_id: rider.id,
      category_at_event: rider.category,
      club_at_event: rider.club || 'INDEPENDIENTE'
    }, { onConflict: 'event_id,rider_id' });
  }

  console.log('--- PROCESO COMPLETADO ---');
}

fix();
