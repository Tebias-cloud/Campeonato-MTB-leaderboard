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

async function fix() {
  console.log("--- REGISTRANDO GANADORA DAMAS MASTER B ---");
  
  const eventId = '04772623-90d4-4bc7-b98f-6f4f79386330'; // 1ª Fecha
  const riderName = 'CAROLINA ELIZABETH VÁSQUEZ CÁRDENAS';
  const category = 'Damas Master B';
  const position = 1;
  const points = 100;
  const raceTime = '4:20:07';

  // 1. Buscar a la corredora
  const { data: rider } = await supabase.from('riders').select('id').ilike('full_name', `%CAROLINA%VÁSQUEZ%`).single();
  
  if (!rider) {
    console.error("No se encontró a Carolina Vásquez en la base de datos de corredores.");
    return;
  }

  console.log(`Corredora encontrada: ${rider.id}`);

  // 2. Insertar el resultado
  const { data: newResult, error } = await supabase.from('results').insert({
    event_id: eventId,
    rider_id: rider.id,
    category_played: category,
    position: position,
    points: points,
    race_time: raceTime
  }).select();

  if (error) {
    console.error("Error al insertar resultado:", error);
  } else {
    console.log("✅ Resultado de Carolina Vásquez insertado con éxito!");
    console.log(newResult);
  }
}

fix();
