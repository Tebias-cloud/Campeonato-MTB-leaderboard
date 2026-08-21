const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xfawvzaapepnxcraliat.supabase.co/';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE2NjEwOCwiZXhwIjoyMDg1NzQyMTA4fQ.u27IPB7ApCxLP4mz7hznxn1WaA5u_oCJx-SS6h-FnuU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: clubs } = await supabase.from('clubs').select('name');
  const clubNames = clubs.map(c => c.name.toUpperCase().trim());
  
  // Find potential duplicates based on Levenshtein distance or simple includes
  const duplicates = [];
  
  for (let i = 0; i < clubNames.length; i++) {
    for (let j = i + 1; j < clubNames.length; j++) {
      const c1 = clubNames[i];
      const c2 = clubNames[j];
      
      // Check if one includes the other (e.g. "FRANKLIN" in "TEAM CYCLES FRANKLIN")
      if (c1.includes(c2) || c2.includes(c1)) {
        if (c1 !== c2 && c1.length > 3 && c2.length > 3) {
           duplicates.push(`${c1} <--> ${c2}`);
        }
      }
    }
  }
  
  console.log("Posibles clubes duplicados encontrados:");
  console.log(duplicates.join('\n'));
}

run().catch(console.error);
