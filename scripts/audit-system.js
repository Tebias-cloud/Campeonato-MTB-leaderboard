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

async function runAudit() {
    console.log("--- SYSTEM AUDIT START ---");

    // 1. Check for orphaned participations
    const { data: participations } = await supabase.from('event_riders').select('rider_id, event_id, dorsal, category_at_event');
    const { data: riders } = await supabase.from('riders').select('id, full_name');
    const { data: events } = await supabase.from('events').select('id, name');

    const riderIds = new Set(riders.map(r => r.id));
    const eventIds = new Set(events.map(e => e.id));

    const orphanedParticipations = participations.filter(p => !riderIds.has(p.rider_id));
    const invalidEventParticipations = participations.filter(p => !eventIds.has(p.event_id));

    console.log(`\n1. Orphan Checks:`);
    console.log(` - Participations without rider profile: ${orphanedParticipations.length}`);
    console.log(` - Participations with invalid event ID: ${invalidEventParticipations.length}`);

    if (orphanedParticipations.length > 0) {
        console.log("   IDs huérfanos:", orphanedParticipations.map(p => p.rider_id).slice(0, 5));
    }

    // 2. Check for duplicate dorsals PER EVENT
    console.log(`\n2. Dorsal Integrity:`);
    const eventDorsals = {};
    participations.forEach(p => {
        if (!p.dorsal) return;
        if (!eventDorsals[p.event_id]) eventDorsals[p.event_id] = {};
        const dStr = p.dorsal.toString();
        if (!eventDorsals[p.event_id][dStr]) eventDorsals[p.event_id][dStr] = [];
        eventDorsals[p.event_id][dStr].push(p.rider_id);
    });

    let totalDuplicates = 0;
    Object.keys(eventDorsals).forEach(eid => {
        const eventName = events.find(e => e.id === eid)?.name || eid;
        const duplicates = Object.keys(eventDorsals[eid]).filter(d => eventDorsals[eid][d].length > 1);
        if (duplicates.length > 0) {
            console.log(` ❌ Evento "${eventName}": ${duplicates.length} dorsales duplicados!`);
            duplicates.forEach(d => {
                console.log(`    - Dorsal ${d} asignado a: ${eventDorsals[eid][d].join(', ')}`);
            });
            totalDuplicates += duplicates.length;
        }
    });

    if (totalDuplicates === 0) {
        console.log(" ✅ No se encontraron dorsales duplicados en ningún evento.");
    }

    // 3. Check for NULL categories in participations
    console.log(`\n3. Data Completeness:`);
    const nullCats = participations.filter(p => !p.category_at_event);
    console.log(` - Participaciones sin categoría: ${nullCats.length}`);
    if (nullCats.length > 0) {
        console.log("   IDs sin categoría:", nullCats.map(p => p.rider_id).slice(0, 5));
    }

    // 4. Check for registrations that might have failed to create a rider
    const { data: regs } = await supabase.from('registrations').select('rut, full_name, status');
    const riderRuts = new Set(riders.map(r => r.rut)); // Wait, I didn't select RUT.
    
    // Let's re-fetch riders with RUT
    const { data: ridersWithRut } = await supabase.from('riders').select('id, rut');
    const riderRutsSet = new Set(ridersWithRut.map(r => r.rut));

    const missingRidersFromRegs = regs.filter(reg => reg.status === 'approved' && !riderRutsSet.has(reg.rut));
    console.log(`\n4. Registration Sync:`);
    console.log(` - Approved registrations without rider profile: ${missingRidersFromRegs.length}`);
    if (missingRidersFromRegs.length > 0) {
        console.log("   RUTs faltantes:", missingRidersFromRegs.map(r => r.rut).slice(0, 5));
    } else {
        console.log(" ✅ Todos los registros aprobados tienen su ficha de rider.");
    }

    console.log("\n--- SYSTEM AUDIT END ---");
}

runAudit();
