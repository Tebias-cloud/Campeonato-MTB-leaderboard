import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Evita que Next.js guarde esto en caché, forzando a que la consulta se haga real
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY! 
    );

    // Hacemos un "SELECT id FROM events LIMIT 1;"
    // Es una tabla pequeña, la consulta pesa literal un par de bytes.
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);

    if (error) throw error;

    return NextResponse.json(
      { status: 'ok', message: 'Ping exitoso. La base de datos del campeonato sigue activa.' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error en el ping de BD:', error);
    return NextResponse.json(
      { status: 'error', message: 'Fallo al conectar con la BD' },
      { status: 500 }
    );
  }
}