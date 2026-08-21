const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://xfawvzaapepnxcraliat.supabase.co/";
const API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmYXd2emFhcGVwbnhjcmFsaWF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNjYxMDgsImV4cCI6MjA4NTc0MjEwOH0.SbB289fSF6dFviyZNW_nY8U3rn1NQTbKYcqFePNONGU";

const supabase = createClient(SUPABASE_URL, API_KEY);

async function main() {
  const { data: events, error } = await supabase.from('events').select('*').order('date', { ascending: true });
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("Events:");
  events.forEach((e, i) => {
    console.log(`[${i+1}] ID: ${e.id}, Date: ${e.date}, Name: ${e.name}, Status: ${e.status}`);
  });
}

main();
