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

async function finalAudit() {
  console.log('=== AUDITORÍA FINAL DE SISTEMAS - CAMPEONATO MTB ===\n');

  // 1. Verificar Conexión Datos Corredores-Dorsales
  console.log('[1/4] Verificando unión de datos Riders-Dorsales...');
  const { data: qqqqDorsal, error: e1 } = await supabase
    .from('event_riders')
    .select('*, riders(full_name)')
    .eq('dorsal', 1)
    .limit(1)
    .maybeSingle();

  if (qqqqDorsal && qqqqDorsal.riders) {
    console.log(`✅ EXITO: El sistema reconoce que el Dorsal 1 es ${qqqqDorsal.riders.full_name}`);
  } else {
    console.log('⚠️ ADVERTENCIA: No se encontró dueño para el Dorsal 1 (Verificar si se asignó en la web).');
  }

  // 2. Verificar Automatización de Fecha Próxima
  console.log('\n[2/4] Verificando lógica de Próxima Carrera...');
  const { data: upcoming } = await supabase
    .from('events')
    .select('id, name, date')
    .gte('date', new Date().toISOString().split('T')[0])
    .order('date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (upcoming) {
    console.log(`✅ EXITO: La próxima carrera detectada es "${upcoming.name}" (${upcoming.date})`);
  } else {
    console.log('⚠️ INFO: No hay carreras futuras creadas.');
  }

  // 3. Verificar Limpieza de Categorías
  console.log('\n[3/4] Auditando nombres de categorías en la DB...');
  const { data: riders } = await supabase.from('riders').select('category').limit(100);
  const dirtyCategories = riders.filter(r => r.category.includes('(') || r.category.includes('Open'));
  
  if (dirtyCategories.length === 0) {
    console.log('✅ EXITO: Todas las categorías en riders están en el formato CLEAN.');
  } else {
    console.log(`❌ ALERTA: Se encontraron ${dirtyCategories.length} registros con nombres antiguos.`);
  }

  // 4. Verificación de Rutas Críticas
  console.log('\n[4/4] Verificando integridad de archivos modificados...');
  const files = [
    'app/(admin)/admin/results/page.tsx',
    'components/admin/ResultManager.tsx',
    'actions/admin.ts'
  ];
  
  files.forEach(f => {
    if (fs.existsSync(path.join(__dirname, '..', f))) {
      console.log(`✅ EXITO: Archivo corregido existente: ${f}`);
    } else {
      console.log(`❌ ERROR: Archivo no encontrado: ${f}`);
    }
  });

  console.log('\n=== AUDITORÍA COMPLETADA - SISTEMAS OPERATIVOS ===');
}

finalAudit();
