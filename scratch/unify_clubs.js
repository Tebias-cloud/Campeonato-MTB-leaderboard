const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function unify(badName, goodName) {
  console.log(`Unificando '${badName}' -> '${goodName}'...`);
  
  // 1. Actualizar a los corredores que tengan el nombre malo (case insensitive is tricky, so we update both exact and lowercase/uppercase variations if possible, or just ilike)
  const { data: ridersToUpdate, error: fetchErr } = await supabase.from('riders').select('id, club').ilike('club', badName);
  
  if (ridersToUpdate && ridersToUpdate.length > 0) {
    for (const r of ridersToUpdate) {
      await supabase.from('riders').update({ club: goodName }).eq('id', r.id);
    }
    console.log(`✅ ${ridersToUpdate.length} corredores actualizados a ${goodName}.`);
  } else {
    console.log(`No se encontraron corredores con el club ${badName}.`);
  }
  
  // 2. Borrar el nombre malo de la tabla oficial de clubes
  const { error: delErr } = await supabase.from('clubs').delete().ilike('name', badName);
  if (!delErr) {
    console.log(`✅ Club '${badName}' eliminado de la tabla oficial.`);
  }
}

async function run() {
  await unify('CYCLES FRANKLIN', 'TEAM CYCLES FRANKLIN');
  await unify('RIDER DESERT', 'TEAM RIDER DESERT');
  await unify('DESERT RIDER', 'TEAM DESERT RIDER');
  await unify('TEAM CCR', 'TEAM CCR CALAMA');
  console.log("¡Proceso de limpieza completado!");
}

run().catch(console.error);
