const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const blog = { created_at: '2026-07-14T14:14:57.397898+00:00' };

  // Get previous post (chronologically older)
  const { data: prevPost, error } = await supabase
    .from('blogs')
    .select('id, title')
    .eq('published', true)
    .lt('created_at', blog.created_at)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  console.log("Prev post data:", prevPost);
  console.log("Prev post error:", error);
}

check();
