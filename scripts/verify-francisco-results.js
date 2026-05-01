const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const FECHA1_ID = '04772623-90d4-4bc7-b98f-6f4f79386330';
const RIDER_ID  = '9ddbd327-5ed8-4b39-8c83-c4f5b96f8298';

async function run() {
  // 1. ¿Tiene algún resultado en CUALQUIER evento?
  const { data: allResults } = await s.from('results').select('*').eq('rider_id', RIDER_ID);
  console.log('=== RESULTADOS DEL RIDER (CUALQUIER FECHA) ===');
  console.log(allResults?.length === 0 ? '→ Sin resultados en ninguna fecha.' : allResults);

  // 2. Todos los resultados de Fecha 1 en Novicios Varones
  const { data: fecha1Results } = await s
    .from('results')
    .select('*, riders(full_name, rut)')
    .eq('event_id', FECHA1_ID)
    .ilike('category_played', '%novici%varon%');

  console.log('\n=== TODOS LOS RESULTADOS FECHA 1 — NOVICIOS VARONES ===');
  if (!fecha1Results || fecha1Results.length === 0) {
    console.log('→ No hay resultados cargados para Novicios Varones en Fecha 1.');
  } else {
    fecha1Results.forEach(r => {
      const esFrancisco = r.rider_id === RIDER_ID;
      console.log(`  ${esFrancisco ? '⚠️  FRANCISCO →' : '  '} Pos:${r.position} | ${r.riders?.full_name} | Pts:${r.points} | Cat:${r.category_played}`);
    });
  }

  // 3. Verificar también buscando por nombre parcial
  const { data: byName } = await s
    .from('results')
    .select('*, events(name)')
    .ilike('riders.full_name', '%lincheo%');
  console.log('\n=== BÚSQUEDA POR NOMBRE "lincheo" EN RESULTS ===');
  console.log(byName?.length === 0 || !byName ? '→ No aparece.' : byName);

  // 4. Resumen total de results de Fecha 1
  const { data: totalFecha1 } = await s.from('results').select('id').eq('event_id', FECHA1_ID);
  console.log(`\n=== TOTAL RESULTADOS CARGADOS EN FECHA 1: ${totalFecha1?.length ?? 0} registros ===`);
}
run();
