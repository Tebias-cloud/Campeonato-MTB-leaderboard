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

function normalize(str) {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toUpperCase();
}

// Datos con tiempos del reporte oficial
const timeUpdates = [
    { name: "MARIANO JUNCO", time: "3:00:49" },
    { name: "ALBERT JAVIER CAROCA ROBLES", time: "3:11:08" },
    { name: "KHRIZ BAEZA", time: "3:20:49" },
    { name: "ENRIQUE ALONSO MONSALVE NAMUNCURA", time: "3:27:39" },
    { name: "JOSÉ MANUEL VIVES SALAZAR", time: "3:30:26" },
    { name: "RAFAEL A CORTEZ MALDONADO", time: "3:34:33" },
    { name: "CRISTIAN GONZÁLEZ BENÍTEZ", time: "3:37:12" },
    { name: "LUCIANO HIDALGO", time: "3:56:20" },
    { name: "ROBERTO CRUCES", time: "4:03:36" },
    { name: "DIABLOS IQUIQUE SPA", time: "4:08:02" },
    { name: "FELIPE CORVALÁN", time: "4:19:21" },
    { name: "FELIPE TOMÁS VERA MOLINA", time: "4:23:45" },
    { name: "FRANCISCO TORRES", time: "4:43:31" },
    { name: "ESTEBAN LARRONDO RODRÍGUEZ", time: "4:48:00" },
    { name: "RICARDO GARRIDO GONZÁLEZ", time: "4:48:01" },
    { name: "ISMAEL ARANEDA", time: "4:53:41" },
    { name: "JONATHAN SALINAS", time: "5:18:07" }
];

async function fixTimes() {
    const { data: riders } = await supabase.from('riders').select('id, full_name');
    const dbRiders = riders.map(r => ({ ...r, norm: normalize(r.full_name) }));

    for (const item of timeUpdates) {
        const normTarget = normalize(item.name);
        let rider = dbRiders.find(r => r.norm === normTarget);
        if (!rider) rider = dbRiders.find(r => r.norm.includes(normTarget) || normTarget.includes(r.norm));

        if (rider) {
            await supabase.from('results').update({
                race_time: item.time
            }).eq('event_id', FECHA_1_ID).eq('rider_id', rider.id);
        }
    }
    console.log("Times updated for Master A.");
}

fixTimes();
