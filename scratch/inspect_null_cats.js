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

async function inspect() {
  const ids = ['e13dba59-5765-4f3d-a774-be1500bced9d', '4dc81830-6b6a-4b15-bd91-bf571daf2f76'];
  
  const { data: eventRiders, error: err1 } = await supabase
    .from('event_riders')
    .select('*, riders(full_name, category, club), events(name)')
    .in('rider_id', ids);
    
  if (err1) {
    console.error('Error fetching event_riders:', err1);
    return;
  }
  
  console.log('--- EVENT RIDERS ---');
  console.log(JSON.stringify(eventRiders, null, 2));
}

inspect();
