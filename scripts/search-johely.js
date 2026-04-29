const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function search() {
  console.log("Searching in riders...");
  const { data: riders, error: err1 } = await supabase
    .from('riders')
    .select('*')
    .or('full_name.ilike.%johely%,full_name.ilike.%enriquez%,full_name.ilike.%joely%,full_name.ilike.%yohely%,full_name.ilike.%enri%');
    
  if (err1) console.error("Error riders:", err1);
  else console.log("Riders:", riders);

  console.log("\nSearching in registration_requests...");
  const { data: requests, error: err2 } = await supabase
    .from('registration_requests')
    .select('*')
    .or('full_name.ilike.%johely%,full_name.ilike.%enriquez%,full_name.ilike.%joely%,full_name.ilike.%yohely%,full_name.ilike.%enri%');

  if (err2) console.error("Error requests:", err2);
  else console.log("Requests:", requests);
}

search();
