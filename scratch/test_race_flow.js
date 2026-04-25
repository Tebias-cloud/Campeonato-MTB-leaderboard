const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://xfawvzaapepnxcraliat.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU');

async function testFullFlow() {
  console.log('--- INICIANDO TEST INTEGRAL (SENIOR) ---');

  try {
    // 1. Usar evento existente
    const { data: event } = await supabase.from('events').select('id').limit(1).single();
    const eventId = event.id;
    console.log('Usando Evento ID:', eventId);

    // 2. Crear solicitud
    const testRut = '99.999.999-9';
    const { data: request, error: reqError } = await supabase.from('registration_requests').insert({
      event_id: eventId,
      full_name: 'TEST RIDER SENIOR',
      email: 'test@senior.cl',
      rut: testRut,
      birth_date: '1990-01-01',
      ciudad: 'IQUIQUE',
      phone: '56912345678',
      category: 'Elite Open',
      club: 'TEAM TEST',
      status: 'pending'
    }).select().single();

    if (reqError) throw reqError;
    console.log('Solicitud lista:', request.id);

    // 3. Simular Aprobación
    console.log('Simulando aprobación de rider...');
    const { data: rider, error: riderError } = await supabase.from('riders').upsert({
      rut: testRut,
      full_name: 'TEST RIDER SENIOR',
      ciudad: 'IQUIQUE',
      birth_date: '1990-01-01',
      category: 'Elite Open',
      club: 'TEAM TEST'
    }, { onConflict: 'rut' }).select().single();

    if (riderError) throw riderError;
    console.log('Rider ID:', rider.id);

    // 4. Vincular a Evento
    const { error: linkError } = await supabase.from('event_riders').upsert({
      event_id: eventId,
      rider_id: rider.id,
      category_at_event: 'Elite Open',
      club_at_event: 'TEAM TEST'
    }, { onConflict: 'event_id, rider_id' });

    if (linkError) throw linkError;
    console.log('Vínculo de evento creado.');

    // 5. Asignar Dorsal
    const { error: dorsalError } = await supabase.from('event_riders')
        .update({ dorsal: 9999 })
        .eq('event_id', eventId)
        .eq('rider_id', rider.id);

    if (dorsalError) throw dorsalError;
    console.log('Dorsal 9999 asignado.');

    // 6. Verificación de integridad
    const { data: finalRider } = await supabase.from('event_riders')
        .select('*, rider:riders(full_name)')
        .eq('rider_id', rider.id)
        .eq('event_id', eventId)
        .single();
    
    console.log('--- RESULTADO DEL TEST ---');
    console.log('Competidor:', finalRider.rider.full_name);
    console.log('Evento ID:', finalRider.event_id);
    console.log('Dorsal:', finalRider.dorsal);
    console.log('--- TEST COMPLETADO EXITOSAMENTE ---');

  } catch (err) {
    console.error('--- FAIL ---');
    console.error(err);
  }
}

testFullFlow();
