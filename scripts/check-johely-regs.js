const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  // Check results
  const { data: res, error: err1 } = await supabase
    .from('results')
    .select('*')
    .eq('rider_id', '83a9a19e-d376-4511-92a5-e59c8584adca');
    
  console.log("Results:", res);

  // Check event_riders history? I already did, they were both "Damas Master B".
  // Wait, let's query the raw `registrations` again just to be absolutely certain what's there.
  const { data: regs } = await supabase
    .from('registrations')
    .select('*')
    .eq('rut', '26469623-2');
  console.log("Regs:", regs);
}

check();
