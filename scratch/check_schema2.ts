import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data, error } = await supabase.from('riders').insert({
    full_name: 'TEST RIDER',
    category: 'TEST CATEGORY',
    club: 'INDEPENDIENTE',
    rut: '12345678-9',
    ciudad: 'TEST',
    birth_date: '1900-01-01'
  }).select('id');
  
  if (error) {
    console.error("FAIL:", error);
  } else {
    console.log("SUCCESS!", data);
    await supabase.from('riders').delete().eq('id', data[0].id);
  }
}
check();
