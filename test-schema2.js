const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: comments, error: cErr } = await supabase.from('blog_comments').select('*').limit(1);
  console.log('blog_comments schema:', comments ? (comments.length > 0 ? Object.keys(comments[0]) : 'table exists, no rows') : cErr);
}
run();
