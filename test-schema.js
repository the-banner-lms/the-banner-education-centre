const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: blogs, error: bErr } = await supabase.from('blogs').select('*').limit(1);
  console.log('blogs schema:', blogs ? Object.keys(blogs[0] || {}) : bErr);
  
  const { data: comments, error: cErr } = await supabase.from('comments').select('*').limit(1);
  console.log('comments schema:', comments ? (comments.length > 0 ? Object.keys(comments[0]) : 'table exists, no rows') : cErr);
}
run();
