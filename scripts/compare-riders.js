const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) env[key.trim()] = value.trim().replace(/"/g, '');
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

// Lista completa de 125 RUTs del export antiguo (ayer a las 9)
const oldRuts = [
  '16653161-6', '29161199-0', '22018103-0', '15491049-2', '16122290-9',
  '15517328-9', '26469623-2', '14106444-4', '16178624-1', '13008457-5',
  '12835496-4', '13007033-7', '14777229-7', '14106448-7', '15924421-0',
  '13863021-8', '15387780-7', '8703676-6', '14108003-2', '12844811-K',
  '13695956-5', '16926854-1', '18057714-9', '17687304-3', '17488026-3',
  '21105351-8', '17323038-9', '23771653-1', '28980047-6', '17392307-4',
  '19399248-K', '18483885-0', '16350796-K', '16765784-2', '17431738-0',
  '24312264-3', '17357019-8', '15004612-2', '18004643-7', '17092225-5',
  '17217185-0', '16081997-9', '18372890-3', '18897238-1', '17374774-8',
  '16488562-3', '16895247-3', '28649088-3', '19177902-9', '16802585-8',
  '16989801-4', '18484038-3', '17778316-1', '16592852-0', '19074062-5',
  '13627395-7', '13420387-0', '15128470-1', '13213884-2', '14359818-7',
  '13412396-6', '13866324-8', '16039817-5', '16247200-3', '18108655-6',
  '15125919-7', '15010635-4', '15512607-8', '13641170-5', '15003289-K',
  '13210961-3', '15147750-K', '13863428-0', '16292637-3', '12965573-9',
  '16056602-7', '13641099-7', '15001904-4', '13689880-9', '13414801-2',
  '14509664-2', '13102342-1', '11616436-1', '12886274-9', '12439101-6',
  '12469080-3', '12581675-4', '11613484-5', '12633205-K', '10986457-9',
  '10000995-1', '10090285-0', '21670738-9', '9684351-8', '9852528-9',
  '15832041-K', '17557015-2', '16171979-K', '27451522-8', '13992185-2',
  '17885602-2', '22589380-2', '9403558-9', '19738401-8', '18385594-8',
  '12426659-9', '20735080-K', '27898987-9', '27910403-K', '13633401-8',
  '17431855-7', '20248012-8', '15070396-4', '23931927-0', '12835296-1',
  '13862347-5', '15934478-9', '18910474-K', '23348238-2', '24509038-2',
  '25823141-4', '19356133-0', '19487332-8', '20012456-1'
];

const oldNames = {
  '16653161-6': 'CONSTANZA PAREDES MARTÍNEZ',
  '29161199-0': 'GINA RIOS',
  '22018103-0': 'KARLA FABIOLA RODRÍGUEZ FRANCO',
  '15491049-2': 'CAROLINA ELIZABETH VÁSQUEZ CÁRDENAS',
  '16122290-9': 'DIANA ALVAREZ',
  '15517328-9': 'GENOVEVA MUÑOZ TABOADA',
  '26469623-2': 'JOHELY HENRIQUES MORINI',
  '14106444-4': 'LORENA SARZOZA',
  '16178624-1': 'SOLEDAD GALLARDO',
  '13008457-5': 'ERNA ARAYA',
  '12835496-4': 'MARIA TERESA VALENCIA PALACIOS',
  '13007033-7': 'SHIRLEY MORA',
  '14777229-7': 'ANDREA RAMIREZ',
  '14106448-7': 'ALEXIS LEIVA',
  '15924421-0': 'CRISTIAN GUZMAN CERDA',
  '13863021-8': 'DIEGO',
  '15387780-7': 'ESTER AHUMADA',
  '8703676-6': 'MARCELO GARCIA',
  '14108003-2': 'RODRIGO CHAVEZ PAREDES',
  '12844811-K': 'RODRIGO EDUARDO MORALES SAGREDO',
  '13695956-5': 'RODRIGO MIRANDA',
  '16926854-1': 'ALEJANDRO VERGARA',
  '18057714-9': 'CHRISTIAN MENESES',
  '17687304-3': 'CRISTIAN PÉREZ',
  '17488026-3': 'DIEGO BISKUPOVIC FERNÁNDEZ',
  '21105351-8': 'EMANUEL FELIPE VALDÉS AGÜERO',
  '17323038-9': 'HANS SILVA',
  '23771653-1': 'JOSIAS ABNER CHOQUE MICHAGA',
  '28980047-6': 'JURGUEN RENÉ ESPADA BARRETO',
  '17392307-4': 'MIGUEL ANGEL GALLARDO MEZA',
  '19399248-K': 'NELSON AGUILAR',
  '18483885-0': 'ALVARO CORTES CORTES',
  '16350796-K': 'ANDRÉS HORMAZÁBAL',
  '16765784-2': 'CAROLINA BURGOS RIQUELME',
  '17431738-0': 'DIEGO ALVAREZ SCIARAFFIA',
  '24312264-3': 'JUAN CAMILO MORENO',
  '17357019-8': 'KATHERINE VIDAL MARCOS',
  '15004612-2': 'LIBER REYES',
  '18004643-7': 'OSVALDO HUMBERTO ACEVEDO ACEVEDO',
  '17092225-5': 'ALBERT JAVIER CAROCA ROBLES',
  '17217185-0': 'CRISTIAN GONZÁLEZ BENÍTEZ',
  '16081997-9': 'DIABLOS IQUIQUE SPA',
  '18372890-3': 'DIEGO IGNACIO AGUILERA',
  '18897238-1': 'FELIPE CORVALÁN',
  '17374774-8': 'JONATHAN MANRIQUEZ GUAJARDO',
  '16488562-3': 'JONATHAN SALINAS',
  '16895247-3': 'LUCIANO HIDALGO',
  '28649088-3': 'MARIANO JUNCO',
  '19177902-9': 'PABLO MUÑOZ',
  '16802585-8': 'PATRICIO GONZÁLEZ',
  '16989801-4': 'RAFAEL A CORTEZ MALDONADO',
  '18484038-3': 'RICARDO GARRIDO GONZÁLEZ',
  '17778316-1': 'ROBERTO CRUCES',
  '16592852-0': 'RODRIGO ANTONIO CAYO BUSTAMANTE',
  '19074062-5': 'RONAL AGUILA VILLEGAS',
  '13627395-7': 'ALEX RUBILAR HERRERA',
  '13420387-0': 'CARLOS OVANDO',
  '15128470-1': 'CLAUDIO OLIVARES SANTELICES',
  '13213884-2': 'CLAUDIO VALDIVIA SCHETTINI',
  '14359818-7': 'DAVID ALEJANDRO ABURTO HENRIQUEZ',
  '13412396-6': 'DAVID MORA RODRIGUEZ',
  '13866324-8': 'ESTEBAN SILVA',
  '16039817-5': 'HUGO VIVANCO',
  '16247200-3': 'JAIME ANDRÉS OYANEDEL RIVERA',
  '18108655-6': 'JOSE JAVIER BETANZO FAUNDEZ',
  '15125919-7': 'JOSÉ MIGUEL LÓPEZ ACEVEDO',
  '15010635-4': 'JUAN SEBASTIAN SCHAFER URZUA',
  '15512607-8': 'LEANDRO CIFUENTES RIFFO',
  '13641170-5': 'LUIS ALEJANDRO VERGARA URIBE',
  '15003289-K': 'LUIS OLIVARES',
  '13210961-3': 'MANUEL ALEJANDRO ROJAS TAVALI',
  '15147750-K': 'MARCELO SUAZO',
  '13863428-0': 'MARCO ANTONIO LIMARÍ PALMA',
  '16292637-3': 'MAURICIO GUTIERREZ',
  '12965573-9': 'PABLO PARRA YAÑEZ',
  '16056602-7': 'RADAMEZ ALFREDO NUÑEZ SHARKEY',
  '13641099-7': 'RONY FLIPPY RAMIREZ',
  '15001904-4': 'TEO RAMIREZ LAY',
  '13689880-9': 'WALDO MANOSALVA',
  '13414801-2': 'YIYO ILLANES',
  '14509664-2': 'ARIEL LILLO',
  '13102342-1': 'CRISTIÁN URBINA ÁVILA',
  '11616436-1': 'CRISTIAN VENEROS APABLAZA',
  '12886274-9': 'DANIEL PACHECO',
  '12439101-6': 'FERNANDO LEÓN NAVARRO HALDEN',
  '12469080-3': 'FRANCISCO JAVIER HUIDOBRO PEREZ',
  '12581675-4': 'JAVIER BARCINA ARGANDOÑA',
  '11613484-5': 'LUIS PEIME',
  '12633205-K': 'LUIS TOLEDO CORONADO',
  '10986457-9': 'MAURICIO DANTE BASÁEZ CALQUÍN',
  '10000995-1': 'RODRIGO MARCHESSI',
  '10090285-0': 'FRANKLIN TRONCOSO',
  '21670738-9': 'JORGE RAMIREZ',
  '9684351-8': 'JUAN AINOL',
  '9852528-9': 'JUAN FERNANDO CARRASCO GALDAMES',
  '15832041-K': 'CLAUDIA VEGA MANNS',
  '17557015-2': 'EMILY KEITH',
  '16171979-K': 'FRANCHESCA CANEO FUENTES',
  '27451522-8': 'LETY LOVERA MENACHO',
  '13992185-2': 'ÁNGEL CORTES',
  '17885602-2': 'CLAUDIO FERNÁNDEZ CASTILLO',
  '22589380-2': 'CRISTHIAN JAVIER CORREA ROJAS',
  '9403558-9': 'DANIEL GRINSPUN SIGUELNITZKY',
  '19738401-8': 'DEMIAN ZAMORANO',
  '18385594-8': 'GIOVANNY ASTUDILLO LAGOS',
  '12426659-9': 'HUGO ALFONSO HICKS GODOY',
  '20735080-K': 'JAROD GUILLERMO ALIAGA CONTRERA',
  '27898987-9': 'JUAN ANTONIO DUQUE DUQUE',
  '27910403-K': 'JUAN DAVID LAURA',
  '13633401-8': 'MANUEL MONTENEGRO',
  '17431855-7': 'MARCELO LEON DÁVILA',
  '20248012-8': 'MATIAS VICENTELO',
  '15070396-4': 'MICHEL REBELLADO URZUA',
  '23931927-0': 'RAIMUNDO PINTO OJALVO',
  '12835296-1': 'RICARDO LETELIER',
  '13862347-5': 'RODRIGO JOSÉ DÍAZ MOYA',
  '15934478-9': 'VICTOR HUGO VENEGAS SOTO',
  '18910474-K': 'VICTOR MONTENEGRO',
  '23348238-2': 'WILLIAM VALDEBENITO BARRA',
  '24509038-2': 'CATALINA GUZMÁN (CATITA)',
  '25823141-4': 'JAIRO MORENO',
  '19356133-0': 'JORGE IGNACIO ANGULO PINTO',
  '19487332-8': 'PEDRO LÓPEZ CISTERNA',
  '20012456-1': 'VCENTE JORQUERA',
};

async function compare() {
  const eventId = '08927adb-29eb-41bc-9376-478ad41a40bc'; // 2ª Fecha
  
  console.log(`=== COMPARACIÓN DE RIDERS - 2ª FECHA ===`);
  console.log(`RUTs en lista antigua: ${oldRuts.length}`);
  
  // Get all current riders for the event
  const { data, error } = await supabase
    .from('event_riders')
    .select('*, riders(full_name, rut, category, club)')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`Riders actuales en BD: ${data.length}`);
  
  // Normalize RUTs from DB
  const currentRuts = new Set(data.map(er => er.riders?.rut).filter(Boolean));
  
  console.log(`\nRUTs únicos en BD: ${currentRuts.size}`);
  
  // Find missing RUTs (in old list but not in current DB)
  const missing = oldRuts.filter(rut => !currentRuts.has(rut));
  
  console.log(`\n=== RIDERS FALTANTES (en lista antigua pero NO en BD actual) ===`);
  if (missing.length === 0) {
    console.log('Ninguno faltante.');
  } else {
    missing.forEach(rut => {
      console.log(`  ❌ ${rut} - ${oldNames[rut] || 'DESCONOCIDO'}`);
    });
  }
  
  // Find extra RUTs (in current DB but not in old list)
  const oldRutSet = new Set(oldRuts);
  const extra = data.filter(er => er.riders?.rut && !oldRutSet.has(er.riders.rut));
  
  console.log(`\n=== RIDERS EXTRA (en BD actual pero NO en lista antigua) ===`);
  if (extra.length === 0) {
    console.log('Ninguno extra.');
  } else {
    extra.forEach(er => {
      console.log(`  ➕ ${er.riders.rut} - ${er.riders.full_name} (${er.riders.category})`);
    });
  }
  
  // Also check if any riders exist in the riders table but not in event_riders
  console.log(`\n=== VERIFICACIÓN ADICIONAL ===`);
  for (const rut of missing) {
    const { data: riderData } = await supabase
      .from('riders')
      .select('id, full_name, rut, category, club')
      .eq('rut', rut);
    
    if (riderData && riderData.length > 0) {
      console.log(`  Rider ${rut} (${oldNames[rut]}) EXISTE en tabla riders pero NO está inscrito en el evento`);
      // Check if they have any event_riders entry
      for (const r of riderData) {
        const { data: erData } = await supabase
          .from('event_riders')
          .select('event_id')
          .eq('rider_id', r.id);
        console.log(`    -> rider_id: ${r.id}, eventos inscritos: ${erData?.length || 0}`, erData);
      }
    } else {
      console.log(`  Rider ${rut} (${oldNames[rut]}) NO EXISTE en tabla riders - fue eliminado completamente`);
    }
  }
}

compare();
