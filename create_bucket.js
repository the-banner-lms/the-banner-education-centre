const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createBucket() {
  const { data, error } = await supabase.storage.createBucket('activities', { public: true });
  if (error) {
    console.log('Error creating bucket:', error.message);
  } else {
    console.log('Bucket created successfully:', data);
  }
}

createBucket();
