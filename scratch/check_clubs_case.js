const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: clubs } = await supabase.from('clubs').select('name').order('name');
  
  console.log("Lista completa de clubes en la DB:");
  const map = new Map();
  
  clubs.forEach(c => {
    console.log(`- "${c.name}"`);
    const normalized = c.name.trim().toUpperCase();
    if (!map.has(normalized)) {
      map.set(normalized, []);
    }
    map.get(normalized).push(c.name);
  });
  
  console.log("\nDuplicados encontrados (ignorando mayúsculas/espacios):");
  for (const [key, values] of map.entries()) {
    if (values.length > 1) {
      console.log(`Grupo: [${key}] -> Variaciones:`, values);
    }
  }
}

run().catch(console.error);
