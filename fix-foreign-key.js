require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: recentAnnouncements, error: annErr } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      created_at,
      author_role,
      author_id
    `)
    .limit(5);
    
  console.log("Without profiles relation:", recentAnnouncements, "Error:", annErr);
}
run();
