import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.from('ranking_global').select('category');
  if (error) {
    console.error(error);
    return;
  }
  const cats = [...new Set(data.map(d => d.category))];
  console.log("Categorias en ranking_global:", cats);
}

main();
