const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSchema() {
  // Let's do a raw sql query via RPC if possible, or just insert
  // Actually, we can use the admin client or just run a query
  // Let's check if the column exists by selecting it
  const { data, error } = await supabase.from('albums').select('cover_image_url').limit(1);
  console.log("data:", data, "error:", error);
}

checkSchema();
