const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('http://127.0.0.1:54321', process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZmF1bHQiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTcyMDYxMjczMSwiZXhwIjo0ODc2MjEyNzMxfQ.v2_Qv9R8...'); // Wait, how do I get the supabase key?
