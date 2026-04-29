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

async function dumpData() {
  console.log('Dumping riders...');
  const { data: riders } = await supabase.from('riders').select('*');
  fs.writeFileSync('all_riders_dump.json', JSON.stringify(riders, null, 2));

  console.log('Dumping registration_requests...');
  const { data: requests } = await supabase.from('registration_requests').select('*');
  fs.writeFileSync('all_requests_dump.json', JSON.stringify(requests, null, 2));

  console.log('Dumping registrations (historical)...');
  const { data: registrations } = await supabase.from('registrations').select('*');
  fs.writeFileSync('all_registrations_dump.json', JSON.stringify(registrations, null, 2));
  
  console.log('Done.');
}

dumpData();
