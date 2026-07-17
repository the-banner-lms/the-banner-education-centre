import { createClient } from '@/utils/supabase/server'
import StudentManager from '@/components/students/StudentManager'

export const dynamic = 'force-dynamic'

export default async function StudentDetailPage(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const params = await props.params
  const studentId = params.id
  const supabase = await createClient()

  // Fetch student profile
  const { data: student, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()

  if (error || !student) {
    return <div>Student not found.</div>
  }

  // Fetch performance history
  const { data: performances } = await supabase
    .from('weekly_performances')
    .select('*')
    .eq('student_id', studentId)
    .order('week_start_date', { ascending: false })

  // Fetch tuition fees history
  const { data: tuitionFees } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('student_id', studentId)
    .order('month_year', { ascending: false })

  // Fetch attendance history
  const { data: attendanceHistory } = await supabase
    .from('daily_attendance')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: false })

  const getStartOfCurrentWeek = () => {
    const d = new Date();
    // Adjust to Myanmar time (UTC + 6:30)
    d.setMinutes(d.getMinutes() + 390);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const date = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const weekParam = typeof searchParams.week === 'string' ? searchParams.week : null;
  const weekStartDateStr = weekParam || getStartOfCurrentWeek();
  const [y, m, d] = weekStartDateStr.split('-').map(Number);
  
  const nextWeek = new Date(y, m - 1, d + 7);
  const prevWeek = new Date(y, m - 1, d - 7);
  const endDate = new Date(y, m - 1, d + 6); // Sunday

  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
  const prevWeekStr = `${prevWeek.getFullYear()}-${String(prevWeek.getMonth() + 1).padStart(2, '0')}-${String(prevWeek.getDate()).padStart(2, '0')}`;
  const weekEndDateFullStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  return (
    <StudentManager 
      student={student}
      studentId={studentId}
      performances={performances || []}
      tuitionFees={tuitionFees || []}
      attendanceHistory={attendanceHistory || []}
      weekStartDateStr={weekStartDateStr}
      prevWeekStr={prevWeekStr}
      nextWeekStr={nextWeekStr}
      weekEndDateFullStr={weekEndDateFullStr}
      basePath="/admin/students"
      showTuition={true} // Admins can manage tuition
      canManageClass
    />
  )
}
