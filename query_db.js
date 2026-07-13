const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://lsmasizfhdmghhtyovgr.supabase.co', 'sb_publishable_CMpTHtc6PTATk_JUXyYgkg_Y2L-6-qQ');

async function main() {
  const { data: perfs } = await supabase.from('weekly_performances').select('id, student_id, week_start_date');
  console.log('All Performances:', perfs);
  
  const { data: atts } = await supabase.from('daily_attendance').select('id, student_id, date, morning_status');
  console.log('All Attendance:', atts);
}
main();
