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

async function checkEvents() {
  const { data: events, error } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  
  console.log("EVENTS:");
  events.forEach(e => {
    console.log(`- ID: ${e.id} | Date: ${e.date} | Status: ${e.status} | Name: ${e.name}`);
  });
}

checkEvents();
