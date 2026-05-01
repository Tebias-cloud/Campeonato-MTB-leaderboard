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

async function checkStorage() {
  const { data: buckets, error } = await s.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Buckets:', buckets);
  for (const bucket of buckets) {
    const { data: files } = await s.storage.from(bucket.name).list();
    console.log(`Files in ${bucket.name}:`, files);
  }
}
checkStorage();
