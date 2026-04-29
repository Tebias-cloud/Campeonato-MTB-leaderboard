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

// This matches lib/utils.ts behavior + legacy cleanup
function normalizeExpected(cat) {
  if (!cat) return 'Sin Categoría';
  let clean = cat.split('(')[0].trim();
  
  if (clean.includes('Novicios Open') || clean.includes('Novicios Varones')) return 'Novicios Varones';
  if (clean.includes('Novicias Open') || clean.includes('Novicias Damas') || clean.includes('Novicia') || clean.includes('Novica')) return 'Novicias Damas';
  if (clean.includes('Enduro')) return 'Enduro Mixto';
  if (clean.includes('E-Bike') || clean.includes('EBike')) return 'EBike Mixto';

  // Apply final-rescue.js rules for Damas just in case it wasn't named perfectly
  if (cat.includes('Damas')) {
    if (cat.includes('Master A')) return 'Damas Master A';
    if (cat.includes('Master B')) return 'Damas Master B';
    if (cat.includes('Master C')) return 'Damas Master C';
    if (cat.includes('Pre Master')) return 'Damas Pre Master';
  }

  // General mappings
  if (clean === 'Varones Master A') return 'Master A';
  if (clean === 'Varones Master B') return 'Master B';
  if (clean === 'Varones Master C') return 'Master C';
  if (clean === 'Varones Master D') return 'Master D';
  if (clean === 'Varones Elite Open') return 'Elite';
  
  return clean;
}

async function findMismatches() {
  console.log('Fetching riders and registrations...');
  const { data: riders, error: err1 } = await supabase.from('riders').select('*');
  const { data: regs, error: err2 } = await supabase.from('registrations').select('*');

  if (err1 || err2) {
    console.error(err1 || err2);
    return;
  }

  console.log(`Found ${riders.length} riders and ${regs.length} registrations.`);

  let mismatches = [];

  for (const rider of riders) {
    // Find their original registration by rut
    // If they have multiple, take the most recent
    const riderRegs = regs.filter(r => r.rut === rider.rut).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    
    if (riderRegs.length > 0) {
      const orig = riderRegs[0].category_selected;
      const expected = normalizeExpected(orig);
      
      // We consider it a mismatch if the base category group differs (e.g., Damas vs Men)
      // or if the expected category does not match their current category
      if (expected !== rider.category) {
        // Filter out acceptable synonyms that might not be perfectly mapped
        if (expected === 'Elite Open' && rider.category === 'Elite') continue;
        if (expected === 'Master D (60 y mas Años)' && rider.category === 'Master D') continue;
        if (expected === 'Master C (50 a 59 Años)' && rider.category === 'Master C') continue;
        if (expected === 'Master B (40 a 49 Años)' && rider.category === 'Master B') continue;
        if (expected === 'Master A (30 a 39 Años)' && rider.category === 'Master A') continue;
        
        mismatches.push({
          rut: rider.rut,
          name: rider.full_name,
          current_in_db: rider.category,
          original_selected: orig,
          expected_normalized: expected
        });
      }
    }
  }

  // Also check for women in Men's categories manually just in case
  const menCats = ['Master A', 'Master B', 'Master C', 'Master D', 'Pre Master', 'Elite', 'Novicios Varones'];
  const femaleNameRegex = /(MARIA|CLAUDIA|ANDREA|PATRICIA|ANA|PAULA|ESTER|CONSTANZA|NINET|LAURA|MONICA|SANDRA|SILVIA|KARINA|YESSICA|MARCELA|VANESSA|LORENA|DANIELA|CAMILA|VALENTINA|JAVIERA|CAROLINA|FRANCISCA|ISIDORA|SOFIA|MARTINA|ANTONIA|FERNANDA|JOHELY|EMILY|ERNA|GINA|LETY|SHIRLEY)/i;
  
  let suspiciousWomen = [];
  for (const rider of riders) {
    if (menCats.includes(rider.category) && rider.full_name.match(femaleNameRegex)) {
      suspiciousWomen.push({
        name: rider.full_name,
        category: rider.category
      });
    }
  }

  console.log("\n--- MISMATCHES BETWEEN SELECTED AND CURRENT ---");
  if (mismatches.length === 0) console.log("No mismatches found!");
  else console.table(mismatches);

  console.log("\n--- SUSPICIOUS WOMEN IN MENS CATEGORIES ---");
  if (suspiciousWomen.length === 0) console.log("No suspicious women found!");
  else console.table(suspiciousWomen);
}

findMismatches();
