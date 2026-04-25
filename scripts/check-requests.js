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

async function checkRequests() {
  const targetRut = '16926854-1';
  const cleanTargetRut = targetRut.replace(/[\.-]/g, '');

  console.log(`Buscando solicitudes de inscripción para RUT: ${targetRut}`);

  const { data: requests, error } = await supabase
    .from('registration_requests')
    .select('*, events(name)');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const matchingRequests = requests.filter(r => r.rut && r.rut.replace(/[\.-]/g, '') === cleanTargetRut);

  console.log('Solicitudes encontradas:', JSON.stringify(matchingRequests, null, 2));

  // También buscar por nombre por si acaso el RUT está mal
  const nameMatch = requests.filter(r => r.full_name && r.full_name.toUpperCase().includes('ALEJANDRO VERGARA'));
  console.log('Solicitudes por nombre (ALEJANDRO VERGARA):', JSON.stringify(nameMatch, null, 2));
}

checkRequests();
