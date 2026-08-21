const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("--- Normalizando Team Cycles Franklin ---");
  
  // Buscar qué variaciones existen actualmente
  const { data: before } = await supabase
    .from('riders')
    .select('club')
    .ilike('club', '%franklin%');
    
  const uniqueNames = [...new Set(before?.map(r => r.club))];
  console.log("Nombres actuales en la BD:", uniqueNames);

  // Actualizar todos a un nombre oficial
  const { data, error } = await supabase
    .from('riders')
    .update({ club: 'TEAM CYCLES FRANKLIN' })
    .ilike('club', '%franklin%');
    
  if (error) {
    console.error("Error actualizando:", error);
  } else {
    console.log("¡Todos los corredores de Franklin han sido unificados a 'TEAM CYCLES FRANKLIN'!");
  }
}

run().catch(console.error);
