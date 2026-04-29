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

async function run() {
  console.log("Updating event statuses...");
  
  const { data: events, error } = await supabase.from('events').select('*').order('date', { ascending: true });
  
  if (error) {
    console.error("Error fetching events", error);
    return;
  }
  
  for (let i = 0; i < events.length; i++) {
    const ev = events[i];
    let newStatus = 'scheduled';
    
    // Las primeras 2 fechas las dejamos "completed"
    if (i < 2) {
      newStatus = 'completed';
    }
    
    console.log(`Updating ${ev.name} from ${ev.status} to ${newStatus}`);
    
    await supabase.from('events').update({ status: newStatus }).eq('id', ev.id);
  }
  
  console.log("Done!");
}

run();
