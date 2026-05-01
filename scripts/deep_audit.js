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

async function runAudit() {
    console.log("--- STARTING DEEP AUDIT ---");

    // 1. Check results count
    const { data: results, count: resCount } = await supabase.from('results').select('rider_id', { count: 'exact' }).eq('event_id', FECHA_1_ID);
    console.log(`- Results found for Fecha 1: ${resCount}`);

    // 2. Check event_riders count
    const { data: inscribed, count: insCount } = await supabase.from('event_riders').select('rider_id', { count: 'exact' }).eq('event_id', FECHA_1_ID);
    console.log(`- Inscribed riders found for Fecha 1: ${insCount}`);

    if (resCount !== insCount) {
        console.warn(`[WARNING] Mismatch: ${resCount} results vs ${insCount} inscriptions.`);
    }

    // 3. Check for riders in dump NOT in DB
    const dumpRiders = JSON.parse(fs.readFileSync('all_riders_dump.json', 'utf8'));
    const { data: currentRiders } = await supabase.from('riders').select('full_name, rut');
    
    const dbRuts = new Set(currentRiders.map(r => r.rut));
    const missingInDb = dumpRiders.filter(r => !dbRuts.has(r.rut));

    console.log(`- Riders in Backup: ${dumpRiders.length}`);
    console.log(`- Riders currently in DB: ${currentRiders.length}`);
    console.log(`- Riders in Backup NOT in DB: ${missingInDb.length}`);

    if (missingInDb.length > 0) {
        console.log("Missing names from backup:", missingInDb.map(r => r.full_name));
    }

    // 4. Check for null points/positions (sanity check)
    const { data: nullPoints } = await supabase.from('results')
        .select('rider_id')
        .eq('event_id', FECHA_1_ID)
        .is('points', null);
    
    if (nullPoints.length > 0) {
        console.warn(`[WARNING] Found ${nullPoints.length} results with NULL points.`);
    }

    // 5. Check if all results have a dorsal
    const resRiderIds = results.map(r => r.rider_id);
    const { data: missingDorsals } = await supabase.from('event_riders')
        .select('rider_id')
        .eq('event_id', FECHA_1_ID)
        .in('rider_id', resRiderIds)
        .is('dorsal', null);

    if (missingDorsals.length > 0) {
        console.warn(`[WARNING] Found ${missingDorsals.length} results without a linked dorsal.`);
    }

    console.log("--- AUDIT COMPLETE ---");
}

runAudit();
