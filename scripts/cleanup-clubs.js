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

async function auditAndCleanClubs() {
  console.log('--- AUDITORÍA Y LIMPIEZA DE CLUBES ---');
  
  // 1. Obtener todos los clubes
  const { data: clubs } = await supabase.from('clubs').select('*');
  if (!clubs) return;

  const seen = new Map();
  const toDelete = [];

  for (const club of clubs) {
    const normalized = club.name.trim().toUpperCase();
    
    if (seen.has(normalized)) {
      // Si ya lo vimos, este registro sobra
      toDelete.push(club.id);
      console.log(`🗑️ Detectado duplicado: "${club.name}" (Se mantiene su versión principal)`);
    } else {
      seen.set(normalized, club.id);
      
      // Si el nombre no está en MAYÚSCULAS o tiene espacios, lo corregimos
      if (club.name !== normalized) {
        console.log(`🔧 Normalizando: "${club.name}" -> "${normalized}"`);
        await supabase.from('clubs').update({ name: normalized }).eq('id', club.id);
      }
    }
  }

  // 2. Borrar duplicados definitivamente
  if (toDelete.length > 0) {
    console.log(`🚀 Borrando ${toDelete.length} registros duplicados...`);
    await supabase.from('clubs').delete().in('id', toDelete);
  }

  // 3. Normalizar también a los riders (por si acaso quedaron nombres "sucios" en su ficha)
  console.log('\n--- NORMALIZANDO RIDERS ---');
  const { data: riders } = await supabase.from('riders').select('id, club');
  for (const r of riders) {
    if (r.club) {
      const normalized = r.club.trim().toUpperCase();
      if (r.club !== normalized) {
        await supabase.from('riders').update({ club: normalized }).eq('id', r.id);
      }
    }
  }

  console.log('✅ PROCESO COMPLETADO: La lista de clubes es ahora ÚNICA y en MAYÚSCULAS.');
}

auditAndCleanClubs();
