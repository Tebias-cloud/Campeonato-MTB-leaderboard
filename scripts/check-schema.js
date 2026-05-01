const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
  });
}
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSchema() {
  const { data: cols, error } = await s.rpc('get_table_columns', { table_name: 'results' }); // Custom RPC maybe?
  if (error) {
     // Fallback: select one row and check keys
     const { data } = await s.from('results').select('*').limit(1);
     console.log('Results Sample:', data);
  } else {
     console.log('Columns:', cols);
  }

  // Check registrations too
  const { data: regData } = await s.from('registrations').select('*').limit(1);
  console.log('Registrations Sample Keys:', Object.keys(regData?.[0] || {}));
}
checkSchema();
