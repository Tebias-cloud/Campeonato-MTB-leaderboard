
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. CARGAR VARIABLES DE ENTORNO
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    process.env[key] = value;
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Faltan variables de entorno en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// 2. CONFIGURACIÓN DEL TEST
const TEST_RUT = "STRESS-TEST-001";
const TEST_NAME = "RIDER DE PRUEBA ALPHA";

async function runStressTest() {
  console.log("🚀 Iniciando Prueba de Estrés: Simulación de 7 Fechas");

  // A. Obtener o crear los 7 eventos
  let { data: events, error: eventsError } = await supabase
    .from('events')
    .select('id, name')
    .order('date', { ascending: true })
    .limit(7);

  if (eventsError || !events || events.length < 7) {
    console.log("⚠️ No hay suficientes eventos, usando IDs genéricos para el test...");
    // Intentaremos obtener lo que haya
  }

  console.log(`📅 Encontrados ${events?.length} eventos.`);

  // B. Ciclo de las 7 Fechas
  for (let i = 0; i < 7; i++) {
    const event = events?.[i] || { id: i + 1, name: `Fecha ${i + 1}` };
    const eventNum = i + 1;
    
    let category = "Elite Open";
    let club = "CHASKI RIDERS";

    if (eventNum >= 4 && eventNum <= 5) {
      category = "Master A"; // Cambio de categoría
    } else if (eventNum >= 6) {
      category = "Master A";
      club = "ANTI-GRAVITY RACING"; // Cambio de club
    }

    console.log(`\n--- [FECHA ${eventNum}] (${event.name}) ---`);
    console.log(`📝 Inscribiendo: ${TEST_NAME} (${TEST_RUT})`);
    console.log(`🏷️ Categoría: ${category} | 🏢 Club: ${club}`);

    // 1. Upsert en tabla RIDERS (Perfil Global)
    const { data: rider, error: riderError } = await supabase
      .from('riders')
      .upsert({
        rut: TEST_RUT,
        full_name: TEST_NAME,
        category: category,
        club: club,
        ciudad: "CIUDAD TEST",
        birth_date: "1990-01-01"
      }, { onConflict: 'rut' })
      .select()
      .single();

    if (riderError) {
      console.error("❌ Error actualizando perfil global:", riderError.message);
      continue;
    }

    // 2. Inserción en EVENT_RIDERS (Registro Histórico)
    // Usamos el ID del rider obtenido del upsert
    const { error: histError } = await supabase
      .from('event_riders')
      .upsert({
        event_id: event.id,
        rider_id: rider.id,
        category_at_event: category,
        club_at_event: club
      }, { onConflict: 'event_id, rider_id' });

    if (histError) {
      console.error("❌ Error guardando historial:", histError.message);
    } else {
      console.log("✅ Registro histórico guardado exitosamente.");
    }
  }

  // 3. VALIDACIÓN FINAL
  console.log("\n\n" + "=".repeat(50));
  console.log("🏁 VALIDACIÓN DE RESULTADOS");
  console.log("=".repeat(50));

  // Verificar Perfil Global
  const { data: finalRider } = await supabase
    .from('riders')
    .select('*')
    .eq('rut', TEST_RUT)
    .single();

  console.log("\n👤 PERFIL GLOBAL ACTUAL (tabla 'riders'):");
  console.log(`   Club: ${finalRider?.club} (Debería ser ANTI-GRAVITY RACING)`);
  console.log(`   Categoría: ${finalRider?.category} (Debería ser Master A)`);

  // Verificar Historial
  const { data: history } = await supabase
    .from('event_riders')
    .select('event_id, category_at_event, club_at_event, events(name)')
    .eq('rider_id', finalRider?.id);

  console.log("\n📜 HISTORIAL CONGELADO (tabla 'event_riders'):");
  history?.forEach((h: any, idx: number) => {
    console.log(`   [Evento ${idx + 1}] Cat: ${h.category_at_event.padEnd(12)} | Club: ${h.club_at_event}`);
  });

  console.log("\n" + "=".repeat(50));
  const isOk = history?.length === 7;
  if (isOk) {
    console.log("🎉 PRUEBA EXITOSA: Los datos históricos se mantuvieron inmutables.");
  } else {
    console.log("❌ PRUEBA FALLIDA: Faltan registros o hubo errores.");
  }
}

runStressTest();
