const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent;
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  const envPath2 = path.join(__dirname, '..', '.env');
  envContent = fs.readFileSync(envPath2, 'utf8');
}
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...rest] = line.split('=');
  if (key && rest.length > 0) env[key.trim()] = rest.join('=').trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function createTestRequest() {
  const request = {
    full_name: "FRANCISCO DANIEL LINCHEO TORREJON",
    rut: "13412713-9",
    email: "franciscolincheo@gmail.com",
    phone: "+56 9 3084 2831",
    club: "COBRALINCH MTB",
    ciudad: "IQUIQUE",
    category: "Novicios Varones",
    birth_date: "1978-05-07",
    status: "pending",
    terms_accepted: true,
    event_id: '04772623-90d4-4bc7-b98f-6f4f79386330' // Fecha 1 (where he is currently inscribed)
  };

  const { error } = await supabase.from('registration_requests').insert(request);
  if (error) {
    console.error("Error creando solicitud:", error);
  } else {
    console.log("✅ Solicitud de prueba creada con éxito. Ve a la sección 'Solicitudes' para probar el botón Eliminar.");
  }
}

createTestRequest();
