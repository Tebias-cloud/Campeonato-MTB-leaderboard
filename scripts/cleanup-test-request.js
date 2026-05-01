const { createClient } = require('@supabase/supabase-js');
const fs = require('fs'), path = require('path');
let env = {};
fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8').split('\n').forEach(l => {
  const [k, ...v] = l.split('=');
  if (k && v.length) env[k.trim()] = v.join('=').trim().replace(/"/g, '');
});
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
s.from('registration_requests').delete().eq('rut', '13412713-9').eq('status', 'pending')
  .then(({ error }) => console.log(error ? 'Error: ' + error.message : '✅ Solicitud de prueba limpiada.'));
