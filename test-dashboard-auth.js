require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data: user, error: userErr } = await supabase.from('profiles').select('*').eq('role', 'student').limit(1);
  if (userErr || !user || user.length === 0) {
    console.log("No student found");
    return;
  }
  
  const student = user[0];
  console.log("Found student:", student.id);
  
  const { data: recentAnnouncements, error: annErr } = await supabase
    .from('announcements')
    .select(`
      id,
      title,
      created_at,
      author_role,
      profiles!announcements_author_id_fkey(first_name, last_name)
    `)
    .in('target_role', ['all', student.role])
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log("Dashboard would fetch announcements:", recentAnnouncements, "Error:", annErr);
}
run();
