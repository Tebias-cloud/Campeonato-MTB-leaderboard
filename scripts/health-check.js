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

async function healthCheck() {
    console.log("--- SUPABASE HEALTH CHECK ---");

    // 1. RIDERS
    const { data: riders, count: riderCount } = await supabase.from('riders').select('id, rut, full_name', { count: 'exact' });
    console.log(`\n[riders]: ${riderCount} records found.`);
    
    // Check for duplicate RUTs (should be impossible due to PK/Unique, but let's check strings)
    const ruts = riders.map(r => r.rut?.trim().toUpperCase());
    const uniqueRuts = new Set(ruts);
    if (uniqueRuts.size < ruts.length) {
        console.log(` ❌ ALERT: Duplicate RUTs found in riders table! (${ruts.length - uniqueRuts.size} duplicates)`);
    } else {
        console.log(" ✅ No duplicate RUTs.");
    }

    // 2. EVENTS & PARTICIPATIONS
    const { data: events } = await supabase.from('events').select('id, name');
    const { data: participations } = await supabase.from('event_riders').select('rider_id, event_id, dorsal');
    
    console.log(`\n[events]: ${events.length} records found.`);
    console.log(`[event_riders]: ${participations.length} total participations.`);

    // Check for riders in events that don't exist in riders table
    const riderIds = new Set(riders.map(r => r.id));
    const orphans = participations.filter(p => !riderIds.has(p.rider_id));
    if (orphans.length > 0) {
        console.log(` ❌ ALERT: ${orphans.length} participations point to missing riders!`);
    } else {
        console.log(" ✅ All participations are linked to valid rider profiles.");
    }

    // 3. RESULTS
    const { data: results } = await supabase.from('results').select('rider_id, event_id, position');
    console.log(`\n[results]: ${results.length} results recorded.`);
    const resultOrphans = results.filter(r => !riderIds.has(r.rider_id));
    if (resultOrphans.length > 0) {
        console.log(` ❌ ALERT: ${resultOrphans.length} results point to missing riders!`);
    } else {
        console.log(" ✅ All results are linked to valid rider profiles.");
    }

    // 4. CLUBS
    const { data: clubs } = await supabase.from('clubs').select('name');
    console.log(`\n[clubs]: ${clubs?.length || 0} registered clubs.`);

    // 5. REGISTRATION REQUESTS
    const { data: pending } = await supabase.from('registration_requests').select('id').eq('status', 'pending');
    console.log(`\n[registration_requests]: ${pending.length} pending requests.`);

    console.log("\n--- HEALTH CHECK FINISHED ---");
}

healthCheck();
