const SUPABASE_URL = "https://xfawvzaapepnxcraliat.supabase.co/";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjYxMDgsImV4cCI6MjA4NTc0MjEwOH0.SbB289fSF6dFviyZNW_nY8U3rn1NQTbKYcqFePNONGU";

async function querySupabase(table, query) {
  const url = `${SUPABASE_URL}rest/v1/${table}?${query}`;
  console.log("Fetching:", url);
  const res = await fetch(url, {
    headers: { apikey: API_KEY, Authorization: `Bearer ${API_KEY}` }
  });
  const text = await res.text();
  try {
      return JSON.parse(text);
  } catch(e) {
      console.log("Not JSON:", text);
      return [];
  }
}

async function main() {
  console.log("Looking for Sebastian Troncoso in riders...");
  const riders = await querySupabase("riders", "full_name=ilike.*sebastian%troncoso*");
  console.log("Riders:", riders.map(r => ({ id: r.id, name: r.full_name, rut: r.rut, category: r.category })));

  const ids = riders.map(r => r.id);
  if (ids.length > 0) {
    console.log(`\nLooking for results for ${ids.length} riders...`);
    const idList = ids.map(id => `"${id}"`).join(",");
    const results = await querySupabase("results", `rider_id=in.(${idList})`);
    console.log("Results:");
    results.forEach(r => {
        console.log(`  Rider: ${r.rider_id}, Event: ${r.event_id}, Pos: ${r.position}, Pts: ${r.points}, Cat: ${r.category_played}`);
    });
    
    const ranking = await querySupabase("ranking_global", `rider_id=in.(${idList})`);
    console.log("\nRanking Global Entries:");
    console.log(ranking.map(r => ({ rider_id: r.rider_id, full_name: r.full_name, category: r.category, total_points: r.total_points, events_count: r.events_count })));
  }
}

main();
