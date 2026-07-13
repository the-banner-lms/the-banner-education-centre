require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Must use service role to execute RPC that bypasses RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Triggering schema cache reload via REST API...");
  // Attempt to reload the schema cache. Sometimes Supabase needs a moment or a manual trigger.
  // The REST API for postgrest exposes a NOTIFY to pgrst.
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
          'Accept-Profile': 'public'
      }
  });
  console.log("PostgREST Schema Reload Ping:", res.status);
  
  // Test again if announcements is recognized
  const { data, error } = await supabase.from('announcements').select('*');
  console.log("Announcements result:", data ? data.length + " rows" : "error", error);
}
run();
