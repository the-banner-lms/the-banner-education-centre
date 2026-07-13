import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TeacherAttendanceTable from '@/components/students/TeacherAttendanceTable'

export const metadata = {
  title: 'Daily Attendance | Teacher',
}

export const dynamic = 'force-dynamic'

export default async function TeacherAttendancePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'teacher') {
    redirect('/dashboard')
  }

  const today = new Date().toISOString().split('T')[0]

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'student')
    .order('full_name')

  const { data: existingAttendance } = await supabase
    .from('daily_attendance')
    .select('*')
    .eq('date', today)

  // Check if teacher has already submitted a report today
  const { data: todayReport } = await supabase
    .from('teacher_daily_reports')
    .select('id')
    .eq('teacher_id', user.id)
    .eq('date', today)
    .single()

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/teacher" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
            &larr; Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Take Daily Attendance</h1>
        </div>
      </div>

      <div className={`mb-6 p-4 border-l-4 ${todayReport ? 'bg-green-50 border-green-400' : 'bg-blue-50 border-blue-400'}`}>
        <div className="flex">
          <div className="ml-3">
            <p className={`text-sm ${todayReport ? 'text-green-700' : 'text-blue-700'}`}>
              {todayReport 
                ? "You have already submitted today's report. You can make updates and re-submit if needed."
                : "Fill out the attendance for all students and submit your daily report."}
            </p>
          </div>
        </div>
      </div>

      <TeacherAttendanceTable 
        students={students || []} 
        initialDate={today} 
        existingAttendance={existingAttendance || []}
      />
    </div>
  )
}
