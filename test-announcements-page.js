const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data, error } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      created_at,
      profiles:author_id (
        first_name,
        last_name
      )
    `)
    .in('target_role', ['all', 'student'])
    .order('created_at', { ascending: false });
  console.log("Announcements List:", data, "Error:", error);
}
check();
