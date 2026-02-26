import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Este cliente ignora toda seguridad y NUNCA debe ir al lado del cliente (Navegador)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);