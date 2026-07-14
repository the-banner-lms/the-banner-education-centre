const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkData() {
  const { data: albums, error: albumError } = await supabase.from('albums').select('*');
  console.log("Albums:", albums, "Error:", albumError);

  const { data: media, error: mediaError } = await supabase.from('activities_media').select('*');
  console.log("Media:", media, "Error:", mediaError);
}

checkData();
