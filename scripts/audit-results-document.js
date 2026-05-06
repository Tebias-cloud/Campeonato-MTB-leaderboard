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

async function audit() {
  console.log("--- AUDITORÍA INTEGRAL DE RESULTADOS (1ª FECHA) ---");
  
  const eventId = '04772623-90d4-4bc7-b98f-6f4f79386330';
  
  // 1. Obtener todos los resultados actuales de la DB para este evento
  const { data: dbResults } = await supabase
    .from('results')
    .select('*, riders(full_name)')
    .eq('event_id', eventId);

  // 2. Mapear resultados por nombre (normalizado) para comparación
  const resultsMap = {};
  dbResults.forEach(r => {
    const name = r.riders.full_name.toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    resultsMap[name] = r;
  });

  // 3. Lista de nombres clave del documento para verificar presencia
  const keyRiders = [
    { name: "JORGE ANGULO PINTO", cat: "Pre Master Mixto", pos: 1 },
    { name: "ANDREA RAMIREZ", cat: "Pre Master Mixto", pos: 4 }, // Recordar que pediste que fuera 4ta
    { name: "MARIANO JUNCO", cat: "Master A", pos: 1 },
    { name: "HANS SILVA", cat: "Elite", pos: 1 },
    { name: "CAROLINA VASQUEZ", cat: "Damas Master B", pos: 1 },
    { name: "DANIELA SUAREZ PIZARRO", cat: "Damas Master A", pos: 1 },
    { name: "MARIA TERESA VALENCIA", cat: "Damas Master C", pos: 1 },
    { name: "CRISTIAN GUZMAN", cat: "EBike Mixto", pos: 1 },
    { name: "DIEGO ALVAREZ SCIARAFFIA", cat: "Enduro Mixto", pos: 1 },
    { name: "LETY LOVERA", cat: "Novicias Damas", pos: 1 }, // El sistema usa "Novicias Damas"
    { name: "JUAN DAVID LAURA", cat: "Novicios Varones", pos: 1 }
  ];

  console.log("\nVerificando presencia de ganadores en la DB:");
  keyRiders.forEach(k => {
    const found = Object.keys(resultsMap).find(name => name.includes(k.name.replace(/VÁSQUEZ/, "VASQUEZ")));
    if (found) {
      const r = resultsMap[found];
      console.log(`✅ [${k.cat}] ${k.name}: En DB (Pos: ${r.position}, Puntos: ${r.points}, Tiempo: ${r.race_time})`);
    } else {
      console.log(`❌ [${k.cat}] ${k.name}: NO ENCONTRADO EN DB`);
    }
  });

  // 4. Verificar Pre Master Mixto específicamente (por el cambio manual previo)
  console.log("\nVerificando Pre Master Mixto:");
  const pmResults = dbResults.filter(r => r.category_played === 'Pre Master Mixto').sort((a,b) => a.position - b.position);
  pmResults.forEach(r => {
    console.log(`- Pos ${r.position}: ${r.riders.full_name} (${r.race_time})`);
  });
}

audit();
