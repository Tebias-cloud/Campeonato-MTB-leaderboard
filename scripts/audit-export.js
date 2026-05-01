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

async function deepAudit(eventId) {
    console.log(`\nDEEP AUDIT for Event: ${eventId}`);
    
    // 1. Participations
    const { data: pData } = await supabase.from('event_riders').select('*').eq('event_id', eventId);
    console.log(`Participations: ${pData.length}`);

    // 2. Riders
    const rIds = pData.map(p => p.rider_id);
    const { data: rData } = await supabase.from('riders').select('*').in('id', rIds);
    console.log(`Riders matched: ${rData.length}`);

    // 3. Null checks in DB
    const pNullCat = pData.filter(p => !p.category_at_event);
    const pNullClub = pData.filter(p => !p.club_at_event);
    const pNullDorsal = pData.filter(p => !p.dorsal);

    console.log(`Participations with NULL Category: ${pNullCat.length}`);
    console.log(`Participations with NULL Club: ${pNullClub.length}`);
    console.log(`Participations with NULL Dorsal: ${pNullDorsal.length}`);

    // 4. Check if finalized data loses anything
    const report = [];
    pData.forEach(p => {
        const r = rData.find(rider => rider.id === p.rider_id);
        if (!r) {
            report.push(`❌ Rider Profile MISSING for ID: ${p.rider_id}`);
            return;
        }

        const displayCat = p.category_at_event || r.category;
        const displayClub = p.club_at_event || r.club;
        
        if (!displayCat) report.push(`⚠️ Rider ${r.full_name} has NO category in either table.`);
        if (!displayClub) report.push(`ℹ️ Rider ${r.full_name} has NO club in either table.`);
    });

    if (report.length > 0) {
        console.log("\nIssues found:");
        report.forEach(m => console.log(m));
    } else {
        console.log("\n✅ No data inconsistencies found in participations mapping.");
    }

    // 5. Check the Export Data mapping for common missing fields
    const fieldsToTest = ['full_name', 'rut', 'email', 'phone', 'birth_date', 'ciudad', 'club', 'category', 'instagram'];
    const exportLabels = ['Corredor', 'RUT', 'Email', 'Teléfono', 'F. Nacimiento', 'Ubicación', 'Club / Team', 'Categoría', 'Instagram'];
    
    console.log("\nField Mapping Check:");
    fieldsToTest.forEach((f, i) => {
        console.log(` - DB [${f}] -> Export [${exportLabels[i]}]`);
    });
}

async function run() {
    const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // 2ª Fecha
    await deepAudit(eventId);
}

run();
