require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Create a client with the SERVICE ROLE key to bypass RLS and insert data
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY // fallback to anon if service role not available, but anon might fail RLS
);

async function run() {
  // 1. Get an admin or staff user to be the author
  const { data: users, error: usersErr } = await supabase.from('profiles').select('*').limit(1);
  if (usersErr || !users || users.length === 0) {
    console.log("Could not find a user to author the announcement:", usersErr);
    return;
  }
  
  const author = users[0];
  console.log("Using author:", author.id, author.role);

  // 2. Insert a dummy announcement
  const { data: ann, error: annErr } = await supabase.from('announcements').insert({
    title: 'Test Announcement for Dashboard',
    content: '<p>This is a test announcement to verify it shows up on the dashboard.</p>',
    target_role: 'all',
    author_id: author.id,
    author_role: author.role
  }).select();
  
  if (annErr) {
    console.log("Error inserting announcement:", annErr);
  } else {
    console.log("Successfully inserted announcement:", ann);
  }
}
run();
