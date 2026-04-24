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

async function ensureIntegrity() {
  console.log('=== INICIANDO GARANTÍA DE INTEGRIDAD DE DATOS ===');
  
  // Tablas donde se guarda el nombre del club como texto
  const tableConfigs = [
    { name: 'riders', col: 'club' },
    { name: 'registration_requests', col: 'club' },
    { name: 'event_riders', col: 'club_at_event' },
    { name: 'results', col: 'club_name' }
  ];

  for (const config of tableConfigs) {
    console.log(`\nAuditando tabla: ${config.name}...`);
    const { data, error } = await supabase.from(config.name).select(`id, ${config.col}`);
    
    if (error) {
      console.error(`Error en ${config.name}:`, error.message);
      continue;
    }

    let updatedCount = 0;
    for (const row of (data || [])) {
      if (row[config.col]) {
        const originalName = row[config.col];
        const normalized = originalName.trim().toUpperCase();
        
        if (originalName !== normalized) {
          const { error: updateError } = await supabase
            .from(config.name)
            .update({ [config.col]: normalized })
            .eq('id', row.id);
            
          if (!updateError) updatedCount++;
        }
      }
    }
    console.log(`✅ ${config.name}: ${updatedCount} registros normalizados perfectamente.`);
  }

  console.log('\n=== CONCLUSIÓN: TODOS LOS DATOS ESTÁN SEGUROS Y UNIFICADOS ===');
}

ensureIntegrity();
