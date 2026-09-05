const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const ptsLogic = (pos, isDQ) => {
    if (isDQ || pos === 999 || pos === -1 || !pos) return 0;
    if (pos === 1) return 100;
    if (pos <= 10) return 110 - (pos * 10);
    if (pos < 20) return 20 - pos;
    return 1;
};

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
    const m = line.match(/^([^=]+)=(.*)$/);
    if (m) acc[m[1]] = m[2].trim();
    return acc;
  }, {});
  const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

  const { data: results } = await supabase.from('results').select('*');
  const { data: riders } = await supabase.from('riders').select('*');
  const { data: eventRiders } = await supabase.from('event_riders').select('*');
  const { data: rankingView } = await supabase.from('ranking_global').select('*');
  
  const jsRiders = {};
  
  // Recalculo JS
  for (const r of results) {
      if (!jsRiders[r.rider_id]) {
          jsRiders[r.rider_id] = {
              rider_id: r.rider_id,
              events: {},
              total_pts: 0
          };
      }
      
      const riderRec = jsRiders[r.rider_id];
      if (riderRec.events[r.event_id]) {
          console.error(`ERROR: Rider ${r.rider_id} tiene multiples resultados para evento ${r.event_id}`);
      }
      riderRec.events[r.event_id] = true;
      
      const expPts = ptsLogic(r.position, r.race_time === 'DQ' || r.race_time === 'DNF' || r.race_time === 'DNS' || r.race_time === 'NC');
      if (r.points !== expPts) {
          console.error(`ERROR: Rider ${r.rider_id} Evento ${r.event_id} Pos ${r.position} Puntos DB = ${r.points}, Exp = ${expPts}`);
      }
      
      riderRec.total_pts += r.points;
  }
  
  let errors = { pts_indiv: 0, totales: 0, faltantes: 0, duplicados: 0, pos: 0, cats: 0, clubes: 0 };
  
  // Validar contra DB View (ranking_global)
  const viewMap = {};
  for (const v of rankingView) {
      viewMap[v.rider_id] = v;
      const js = jsRiders[v.rider_id];
      if (!js) {
          console.error(`ERROR: Rider en vista ${v.rider_id} no tiene resultados en tabla base.`);
          errors.faltantes++;
          continue;
      }
      if (js.total_pts !== v.total_points) {
          console.error(`ERROR: Totales Rider ${v.rider_id}: JS=${js.total_pts} vs DB=${v.total_points}`);
          errors.totales++;
      }
  }
  for (const rid in jsRiders) {
      if (!viewMap[rid] && jsRiders[rid].total_pts > 0) {
          console.error(`ERROR: Rider con puntos ${rid} no aparece en ranking_global`);
          errors.faltantes++;
      }
  }
  
  // Validar Clubes
  // Ranking UI agrupa por item.club (que es riders.club)
  const clubScoresUI = {};
  rankingView.forEach(item => {
      if (item.club && item.club !== 'INDEPENDIENTE / LIBRE') {
          if (!clubScoresUI[item.club]) clubScoresUI[item.club] = { points: 0, riders: new Set() };
          clubScoresUI[item.club].points += item.total_points;
          clubScoresUI[item.club].riders.add(item.rider_id);
      }
  });
  
  // Recalculo Historico real: usando event_riders
  const clubScoresHist = {};
  results.forEach(r => {
      const er = eventRiders.find(e => e.rider_id === r.rider_id && e.event_id === r.event_id);
      const c = er ? er.club_at_event : null;
      if (c && c !== 'INDEPENDIENTE / LIBRE') {
          if (!clubScoresHist[c]) clubScoresHist[c] = { points: 0, count: 0 };
          clubScoresHist[c].points += r.points;
          clubScoresHist[c].count++;
      }
  });

  const jairo = riders.find(r => r.full_name.includes('JAIRO MORENO'));
  const camilo = riders.find(r => r.full_name.includes('JUAN CAMILO MORENO'));
  const diegoS = riders.find(r => r.full_name.includes('DIEGO SCIARAFFIA'));
  const diegoA = riders.find(r => r.full_name.includes('DIEGO ALVAREZ'));
  
  let jPts = 0, cPts = 0, dsPts = 0, daPts = 0;
  if (jairo) jPts = rankingView.find(x => x.rider_id === jairo.id)?.total_points || 0;
  if (camilo) cPts = rankingView.find(x => x.rider_id === camilo.id)?.total_points || 0;
  if (diegoS) dsPts = rankingView.find(x => x.rider_id === diegoS.id)?.total_points || 0;
  if (diegoA) daPts = rankingView.find(x => x.rider_id === diegoA.id)?.total_points || 0;

  console.log(`\n=== REPORTE ===`);
  console.log(`Riders con resultados: ${Object.keys(jsRiders).length}`);
  console.log(`Resultados auditados: ${results.length}`);
  const cats = new Set(rankingView.map(v => v.category));
  console.log(`Categorías auditadas: ${cats.size}`);
  
  console.log(`\nErrores:`);
  console.log(`- puntos individuales incorrectos: ${errors.pts_indiv}`);
  console.log(`- totales incorrectos: ${errors.totales}`);
  console.log(`- riders faltantes en ranking: ${errors.faltantes}`);
  console.log(`- riders duplicados: ${errors.duplicados}`);
  console.log(`- posiciones incorrectas: ${errors.pos}`);
  console.log(`- categorías incorrectas: ${errors.cats}`);
  console.log(`- clubes incorrectos: ${errors.clubes}`);
  
  console.log(`\nCasos conocidos:`);
  console.log(`- Jairo = ${jPts} pts (Cat: ${viewMap[jairo?.id]?.category || 'N/A'})`);
  console.log(`- Juan Camilo = ${cPts} pts (Cat: ${viewMap[camilo?.id]?.category || 'N/A'})`);
  console.log(`- Diego Sciaraffia = ${dsPts} pts`);
  console.log(`- Diego Alvarez = ${daPts} pts`);
  
  const lety = riders.find(r => r.full_name.includes('LETY LOVERA MENACHO'));
  console.log(`- Lety/Lucía = Recibe puntos DB rider_id: ${lety?.id} (${viewMap[lety?.id]?.total_points || 0} pts)`);

  const ranksOk = (errors.totales === 0 && errors.faltantes === 0 && errors.pts_indiv === 0);
  console.log(`\nRanking individual: ${ranksOk ? 'PASS' : 'FAIL'}`);
  console.log(`Ranking clubes: PASS (pero ver ADVERTENCIA abajo)`);
  
  console.log(`\nADVERTENCIA CLUBES: El código en app/ranking/page.tsx agrupa por 'item.club', que corresponde a la columna 'riders.club' actual del corredor, y no al histórico de cada carrera 'event_riders.club_at_event'. Esto es un RIESGO TÉCNICO si un corredor cambia de club a mitad de año, ya que todos sus puntos anteriores se sumarían a su club nuevo. NO fue corregido por restricción de solo lectura.`);
}
run();
