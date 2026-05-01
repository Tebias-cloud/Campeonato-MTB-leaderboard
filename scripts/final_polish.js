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

// Mapa completo de tiempos extraído del reporte oficial enviado por el usuario
const masterTimeMap = [
    // Pre Master
    { n: "JORGE IGNACIO ANGULO PINTO", t: "4:06:58" },
    { n: "VÍCTOR FABIAN LÓPEZ BAHAMONDE", t: "4:53:40" },
    { n: "DIEGO MARTINEZ", t: "6:42:20" },
    // Master A (Repaso por si acaso)
    { n: "MARIANO JUNCO", t: "3:00:49" },
    { n: "ALBERT JAVIER CAROCA ROBLES", t: "3:11:08" },
    { n: "KHRIZ BAEZA", t: "3:20:49" },
    { n: "ENRIQUE ALONSO MONSALVE NAMUNCURA", t: "3:27:39" },
    { n: "JOSÉ MANUEL VIVES SALAZAR", t: "3:30:26" },
    { n: "RAFAEL A CORTEZ MALDONADO", t: "3:34:33" },
    { n: "CRISTIAN GONZÁLEZ BENÍTEZ", t: "3:37:12" },
    { n: "LUCIANO HIDALGO", t: "3:56:20" },
    { n: "ROBERTO CRUCES", t: "4:03:36" },
    { n: "DIABLOS IQUIQUE SPA", t: "4:08:02" },
    { n: "FELIPE CORVALÁN", t: "4:19:21" },
    { n: "FELIPE TOMÁS VERA MOLINA", t: "4:23:45" },
    { n: "FRANCISCO TORRES", t: "4:43:31" },
    { n: "ESTEBAN LARRONDO RODRÍGUEZ", t: "4:48:00" },
    { n: "RICARDO GARRIDO GONZÁLEZ", t: "4:48:01" },
    { n: "ISMAEL ARANEDA", t: "4:53:41" },
    { n: "JONATHAN SALINAS", t: "5:18:07" },
    // Master B
    { n: "MARCO MIRANDA CASTILLO", t: "3:07:12" },
    { n: "MARCO ANTONIO LIMARÍ PALMA", t: "3:16:52" },
    { n: "JUAN SEBASTIAN SCHAFER URZUA", t: "3:29:04" },
    { n: "HUGO VIVANCO", t: "3:31:44" },
    { n: "FABIÁN ANDRÉS BAHAMONDES", t: "3:31:52" },
    { n: "WALDO MANOSALVA", t: "3:34:02" },
    { n: "LEANDRO CIFUENTES RIFFO", t: "3:37:15" },
    { n: "DAVID ALEJANDRO ABURTO HENRIQUEZ", t: "3:47:58" },
    { n: "MAURICIO GUTIERREZ", t: "3:48:59" },
    { n: "MARCELO SUAZO", t: "3:50:08" },
    { n: "TEO RAMIREZ LAY", t: "3:51:22" },
    { n: "ALEX RUBILAR HERRERA", t: "4:05:31" },
    { n: "ENRIQUE GALLEGUILLOS", t: "4:06:55" },
    { n: "DIEGO ARACENA AGUIRRE", t: "4:19:08" },
    { n: "HÉCTOR MILLAR", t: "4:19:09" },
    { n: "RONY FLIPPY RAMIREZ", t: "4:31:00" },
    { n: "LUIS OLIVARES", t: "4:32:58" },
    { n: "DAVID MORA RODRIGUEZ", t: "4:34:00" },
    { n: "JOSE LUIS CABELLO ALVAREZ", t: "4:35:19" },
    { n: "DAVID PEREZ", t: "4:57:09" },
    { n: "RADAMEZ ALFREDO NUÑEZ SHARKEY", t: "4:59:18" },
    { n: "FERNANDO CÁRDENAS ENIGMA", t: "5:04:46" },
    { n: "ERNESTO MENESES ELGUETA", t: "5:07:55" },
    { n: "CLAUDIO OLIVARES SANTELICES", t: "5:12:01" },
    { n: "CLAUDIO VALDIVIA SCHETTINI", t: "5:41:40" },
    { n: "ESTEBAN SILVA", t: "6:39:11" },
    // Master C
    { n: "ARIEL LILLO", t: "3:07:34" },
    { n: "CRISTIÁN URBINA ÁVILA", t: "4:05:27" },
    { n: "PATRICIO GALVEZ CANTILLANO", t: "4:12:26" },
    { n: "LUIS TOLEDO CORONADO", t: "4:12:27" },
    { n: "JAVIER BARCINA ARGANDOÑA", t: "4:21:14" },
    { n: "LUIS LARA SÁNCHEZ", t: "4:36:03" },
    { n: "FELIPE ROJAS ANDRADE", t: "4:41:10" },
    { n: "CRISTIAN VENEROS APABLAZA", t: "5:05:25" },
    { n: "DANIEL PACHECO", t: "5:21:16" },
    { n: "LUIS PEIME", t: "5:21:56" },
    { n: "CLAUDIO PITICAR OLIVO", t: "5:28:54" },
    { n: "FERNANDO LEÓN NAVARRO HALDEN", t: "8:20:05" },
    // Master D
    { n: "JORGE RAMIREZ", t: "3:43:01" },
    { n: "JUAN AINOL", t: "3:55:10" },
    { n: "FRANKLIN TRONCOSO", t: "4:09:18" },
    { n: "JUAN FERNANDO CARRASCO GALDAMES", t: "4:41:59" },
    { n: "RUBEN PIZARRO CRUZ", t: "4:43:49" },
    { n: "CELSO RAÚL LIRA DONAIRE", t: "4:44:21" },
    { n: "JOSÉ VARGAS NICOLÁ", t: "4:45:51" },
    { n: "PEDRO LEIVA", t: "5:13:21" },
    // Elite
    { n: "HANS SILVA", t: "3:01:56" },
    { n: "ALEJANDRO VERGARA", t: "3:03:55" },
    { n: "CRISTIAN PÉREZ", t: "3:12:54" },
    { n: "CHRISTIAN MENESES", t: "3:28:20" },
    // Damas
    { n: "ANDREA RAMIREZ", t: "4:09:38" },
    { n: "DANIELA SUAREZ PIZARRO", t: "4:05:32" },
    { n: "CONSTANZA PAREDES MARTÍNEZ", t: "4:08:47" },
    { n: "DIARA BELARDI", t: "4:19:25" },
    { n: "KARLA FABIOLA RODRÍGUEZ FRANCO", t: "5:27:29" },
    { n: "GINA PAOLA RIOS BUENO", t: "5:27:36" },
    { n: "CAROLINA ELIZABETH VÁSQUEZ CÁRDENAS", t: "4:20:07" },
    { n: "LORENA SARZOZA", t: "5:07:58" },
    { n: "JOHELY HENRIQUES MORINI", t: "5:09:00" },
    { n: "MARIA TERESA VALENCIA PALACIOS", t: "4:50:05" },
    { n: "ERNA ARAYA", t: "5:09:02" },
    { n: "SHIRLEY MORA", t: "5:12:17" },
    // EBike / Enduro
    { n: "CRISTIAN GUZMAN CERDA", t: "2:08:31" },
    { n: "ESTER AHUMADA", t: "2:45:48" },
    { n: "DIEGO VILLALOBOS CODOCEO", t: "3:04:39" },
    { n: "DIEGO ALVAREZ SCIARAFFIA", t: "4:18:05" },
    { n: "ANDRÉS HORMAZÁBAL", t: "6:13:37" },
    // Novicios
    { n: "LETY LOVERA MENACHO", t: "3:55:04" },
    { n: "CLAUDIO VEGA MANNS", t: "4:06:07" },
    { n: "JUAN DAVID LAURA", t: "2:39:35" },
    { n: "VÍCTOR TAPIA RAMÍREZ", t: "2:45:41" },
    { n: "DANIEL GRINSPUN SIGUELNITZKY", t: "2:57:36" },
    { n: "MANUEL MONTENEGRO", t: "3:02:08" },
    { n: "CRISTIAN JIMENEZ", t: "3:03:28" },
    { n: "GUILLERMO ESPINOZA GONZÁLEZ", t: "4:12:01" },
    { n: "RICARDO LETELIER", t: "4:22:03" }
];

async function finalCleanup() {
    console.log("Cleaning up positions 0 and restoring all times...");

    const { data: riders } = await supabase.from('riders').select('id, full_name');
    const dbRiders = riders.map(r => ({ ...r, norm: normalize(r.full_name) }));

    // 1. Restore all times
    let timeCount = 0;
    for (const item of masterTimeMap) {
        const normTarget = normalize(item.n);
        let rider = dbRiders.find(r => r.norm === normTarget);
        if (!rider) rider = dbRiders.find(r => r.norm.includes(normTarget) || normTarget.includes(r.norm));

        if (rider) {
            const { error } = await supabase.from('results').update({
                race_time: item.t
            }).eq('event_id', FECHA_1_ID).eq('rider_id', rider.id);
            if (!error) timeCount++;
        }
    }
    console.log(`Successfully updated ${timeCount} race times.`);

    // 2. Fix Position 0 (Set to 99 for DQ or unknown)
    const { data: posZero, error: zeroErr } = await supabase.from('results')
        .select('id, rider_id')
        .eq('event_id', FECHA_1_ID)
        .eq('position', 0);
    
    if (posZero && posZero.length > 0) {
        for (const res of posZero) {
            await supabase.from('results').update({ position: 99 }).eq('id', res.id);
        }
        console.log(`Moved ${posZero.length} results from position 0 to 99.`);
    }

    console.log("Final cleanup complete.");
}

finalCleanup();
