import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envFile = fs.readFileSync('.env.local', 'utf8');
const urlMatch = envFile.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = envFile.match(/SUPABASE_SERVICE_ROLE_KEY=(.*)/);

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function check() {
  const { data: event } = await supabase.from('events').select('id, name').ilike('name', '%Cobra%').single();
  if (!event) return console.log("Event not found");

  const { data: results } = await supabase.from('results').select('category_played, position, points').eq('event_id', event.id);
  
  const byCategory: any = {};
  results?.forEach(r => {
    if (!byCategory[r.category_played]) byCategory[r.category_played] = [];
    byCategory[r.category_played].push({ pos: r.position, pts: r.points });
  });

  console.log(`--- RESULTADOS ${event.name} ---`);
  console.log(`Total: ${results?.length}`);
  for (const cat in byCategory) {
    byCategory[cat].sort((a: any, b: any) => a.pos - b.pos);
    console.log(`\n${cat} (${byCategory[cat].length} corredores):`);
    console.log(byCategory[cat].slice(0, 3).map((r:any) => `${r.pos}º -> ${r.pts} pts`).join(' | '));
  }
}
check();
