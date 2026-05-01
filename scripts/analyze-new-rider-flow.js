const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const TODAY = new Date().toISOString().split('T')[0];
  console.log('=== ANÁLISIS: ¿A QUÉ FECHA SE INSCRIBE UN RIDER NUEVO? ===\n');
  console.log('Fecha actual del servidor:', TODAY, '\n');

  // Replicar exactamente la lógica de saveRider
  const { data: upcomingEvent } = await admin
    .from('events')
    .select('id, name, date, status')
    .gte('date', TODAY)
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  console.log('Lógica del saveRider: busca el próximo evento cuya fecha >= hoy...');
  if (!upcomingEvent) {
    console.log('RESULTADO: No encontró ningún evento futuro → El rider se crea en la DB pero NO queda inscrito en ninguna fecha.');
  } else {
    console.log('RESULTADO: Se inscribe automáticamente en:');
    console.log('  - ID:     ', upcomingEvent.id);
    console.log('  - Nombre: ', upcomingEvent.name);
    console.log('  - Fecha:  ', upcomingEvent.date);
    console.log('  - Status: ', upcomingEvent.status);
  }

  // Mostrar todos los eventos con su fecha y status para contexto
  const { data: allEvents } = await admin.from('events').select('name, date, status').order('date');
  console.log('\n=== TODOS LOS EVENTOS ===');
  allEvents?.forEach(e => {
    const isPast = e.date < TODAY;
    const isNext = upcomingEvent && e.date === upcomingEvent.date;
    console.log(`  ${isNext ? '>>> ' : isPast ? '    ' : '    '}[${e.status.toUpperCase()}] ${e.name} — ${e.date} ${isPast ? '(PASADA)' : isNext ? '(← AQUÍ SE INSCRIBEN)' : '(futura)'}`);
  });

  // Verificar el rider de prueba
  const { data: testRider } = await admin.from('riders').select('id, full_name').eq('rut', '11.111.111-1').maybeSingle();
  if (testRider) {
    const { data: inscriptions } = await admin
      .from('event_riders')
      .select('event_id, events(name, date)')
      .eq('rider_id', testRider.id);
    console.log('\n=== RIDER DE PRUEBA "RIDER PRUEBA ADMIN" ===');
    if (!inscriptions || inscriptions.length === 0) {
      console.log('  → No está inscrito en ningún evento.');
    } else {
      inscriptions.forEach((i) => console.log(`  → Inscrito en: ${i.events?.name} (${i.events?.date})`));
    }
  }

  // Problema potencial: ¿status del próximo evento?
  console.log('\n=== DIAGNÓSTICO ===');
  if (upcomingEvent?.status === 'completed') {
    console.log('⚠️  PROBLEMA: El próximo evento por fecha está marcado como "completed".');
    console.log('   Un rider nuevo se inscribirá en un evento ya terminado.');
    console.log('   Considera cambiar el criterio para buscar eventos con status="active" o "scheduled".');
  } else if (upcomingEvent?.status === 'scheduled' || upcomingEvent?.status === 'active') {
    console.log('OK: El próximo evento tiene status correcto (' + upcomingEvent.status + ').');
  }
}
run();
