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

async function listTables() {
  const { data, error } = await s.from('results').select('id').limit(1);
  console.log('Results table exists check:', { data, error });
  
  // Try to find any other tables
  const { data: tables } = await s.rpc('get_tables_info'); // if it exists
  console.log('Tables info:', tables);
}
listTables();
