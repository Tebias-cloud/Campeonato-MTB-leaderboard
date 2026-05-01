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

async function checkCounts() {
  const { data: events } = await supabase.from('events').select('id, name');
  
  console.log('--- CONTEO DE INSCRITOS POR FECHA ---');
  for (const event of events) {
    const { count, error } = await supabase
      .from('event_riders')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', event.id);
    
    console.log(`${event.name.padEnd(25)}: ${count || 0} inscritos`);
  }
}

checkCounts();
