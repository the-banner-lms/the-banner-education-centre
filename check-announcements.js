require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);
async function run() {
  const { data, error } = await supabase.from('announcements').select('*');
  console.log("Announcements in DB:", JSON.stringify(data, null, 2), "Error:", error);
}
run();
