require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
  const { data: a } = await supabase.from('announcements').select('*').limit(1);
  console.log('Announcements:', a);
  const { data: b, error } = await supabase.from('announcement_replies').select('*').limit(1);
  console.log('Replies:', b, error);
}
run();
