const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
let envContent = fs.readFileSync(envPath, 'utf8');
let env = {};
envContent.split('\n').forEach(l => {
    const [k, ...v] = l.split('=');
    if (k && v.length) env[k.trim()] = v.join('=').trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const FECHA_1_ID = "04772623-90d4-4bc7-b98f-6f4f79386330";

const dorsalFixes = [
    { name: "JORGE IGNACIO ANGULO PINTO", bib: 17 },
    { name: "RAFAEL A CORTEZ MALDONADO", bib: 29 },
    { name: "MARCO ANTONIO LIMARÍ PALMA", bib: 47 },
    { name: "KARLA FABIOLA RODRÍGUEZ FRANCO", bib: 10 },
    { name: "DIARA BELARDI", bib: 8 },
    { name: "CAROLINA ELIZABETH VÁSQUEZ CÁRDENAS", bib: 4 },
    { name: "ALBERT JAVIER CAROCA ROBLES", bib: 18 },
    { name: "DIABLOS IQUIQUE SPA", bib: 97 },
    { name: "RADAMEZ ALFREDO NUÑEZ SHARKEY", bib: 49 }
];

async function fixDorsals() {
    console.log("Fixing missing dorsals for special names...");
    const { data: riders } = await supabase.from('riders').select('id, full_name');
    
    for (const fix of dorsalFixes) {
        const r = riders.find(ri => ri.full_name.includes(fix.name) || fix.name.includes(ri.full_name));
        if (r) {
            const { error } = await supabase.from('event_riders').upsert({
                event_id: FECHA_1_ID,
                rider_id: r.id,
                dorsal: fix.bib
            }, { onConflict: 'event_id,rider_id' });
            if (!error) console.log(`  Fixed dorsal for ${fix.name} -> ${fix.bib}`);
        }
    }
}

fixDorsals();
