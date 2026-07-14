import { createClient } from '@supabase/supabase-js';
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() { const {data} = await supabase.from('profiles').select('email, role').eq('email', 'thureinminn@gmail.com'); console.log(data); }
check();
