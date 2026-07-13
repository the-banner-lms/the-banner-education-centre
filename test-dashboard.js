const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  const { data: recentAnnouncements, error } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      created_at,
      author_role
    `)
    .in('target_role', ['all', 'student'])
    .order('created_at', { ascending: false })
    .limit(5);
  console.log("Announcement query on dashboard:", recentAnnouncements, "Error:", error);
}
check();
