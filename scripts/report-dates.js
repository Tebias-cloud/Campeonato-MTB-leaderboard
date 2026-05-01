const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const env = {};
try {
    const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, ...value] = line.split('=');
        if (key && value) env[key.trim()] = value.join('=').trim().replace(/^"(.*)"$/, '$1');
    });
} catch (e) {}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function report() {
    const { data: participations } = await supabase.from('event_riders').select('event_id');
    const counts = {};
    participations.forEach(p => counts[p.event_id] = (counts[p.event_id] || 0) + 1);

    const { data: events } = await supabase.from('events').select('name, date, id').order('date', { ascending: true });
    
    console.log("\nREPORTE DE INSCRIPCIONES POR FECHA\n");
    console.log("FECHA      | EVENTO                    | INSCRITOS");
    console.log("-----------|---------------------------|----------");
    events.forEach(e => {
        const date = e.date ? e.date.split('T')[0] : 'S/F';
        console.log(`${date.padEnd(10)} | ${e.name.padEnd(25)} | ${counts[e.id] || 0}`);
    });
    console.log("");
}

report();
