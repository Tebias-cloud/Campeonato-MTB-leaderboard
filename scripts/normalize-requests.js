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

// Función de normalización copiada de lib/utils.ts (pero adaptada para JS)
const normalizeCategory = (cat) => {
  if (!cat) return 'Sin Categoría';
  
  const clean = cat.split('(')[0].trim();

  if (clean.includes('Novicios Open') || clean.includes('Novicios Varones')) return 'Novicios Varones';
  if (clean.includes('Novicias Open') || clean.includes('Novicias Damas')) return 'Novicias Damas';
  if (clean.includes('Enduro')) return 'Enduro Mixto';
  if (clean.includes('E-Bike') || clean.includes('EBike')) return 'EBike Mixto';
  if (clean.includes('Elite Open')) return 'Elite';
  if (clean.includes('y más') || clean.includes('y Más')) {
      return clean.split(' y ')[0].trim();
  }
  
  return clean;
};

async function normalizeRequests() {
  console.log('--- NORMALIZANDO CATEGORÍAS EN REGISTRATION_REQUESTS ---');
  
  const { data: requests, error } = await supabase
    .from('registration_requests')
    .select('id, category');

  if (error) {
    console.error('Error fetching requests:', error);
    return;
  }

  let updatedCount = 0;
  for (const req of requests) {
    const normalized = normalizeCategory(req.category);
    if (normalized !== req.category) {
      console.log(`Actualizando: "${req.category}" -> "${normalized}"`);
      const { error: updateError } = await supabase
        .from('registration_requests')
        .update({ category: normalized })
        .eq('id', req.id);
      
      if (updateError) {
        console.error(`Error actualizando ${req.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`\n✅ Normalización completada. ${updatedCount} solicitudes actualizadas.`);
}

normalizeRequests();
