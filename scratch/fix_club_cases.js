const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: clubs } = await supabase.from('clubs').select('name').order('name');
  
  const map = new Map();
  clubs.forEach(c => {
    const normalized = c.name.trim().toUpperCase();
    if (!map.has(normalized)) map.set(normalized, []);
    map.get(normalized).push(c.name);
  });
  
  for (const [canonical, values] of map.entries()) {
    if (values.length > 1) {
      console.log(`\nUnificando grupo: [${canonical}]`);
      
      // Encontrar variaciones que NO sean exactamente el canonical
      const badVariations = values.filter(v => v !== canonical);
      
      // Si por alguna razón el canonical estricto no existe en la DB, lo creamos y las otras son bad
      const exactCanonicalExists = values.includes(canonical);
      const targetName = exactCanonicalExists ? canonical : canonical; // target siempre en mayúscula
      
      if (!exactCanonicalExists) {
         // Insertar el canonical si no existe
         await supabase.from('clubs').upsert({ name: targetName });
      }

      for (const bad of badVariations) {
        console.log(`  Moviendo corredores de '${bad}' a '${targetName}'...`);
        // Actualizar tabla riders
        const { data, error } = await supabase.from('riders')
          .update({ club: targetName })
          .eq('club', bad)
          .select('id');
          
        if (error) {
            console.error(`  Error actualizando riders para ${bad}:`, error);
        } else {
            console.log(`    ✅ ${data.length} corredores actualizados.`);
        }
        
        // Borrar de la tabla de clubes
        await supabase.from('clubs').delete().eq('name', bad);
        console.log(`    ✅ Club '${bad}' eliminado de sugerencias.`);
      }
    }
  }
  console.log("\nProceso finalizado de forma segura.");
}

run().catch(console.error);
