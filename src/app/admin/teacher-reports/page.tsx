import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import TeacherReportsViewer from '@/components/students/TeacherReportsViewer'

export const metadata = {
  title: 'Teacher Reports | Admin',
}

export const dynamic = 'force-dynamic'

export default async function AdminTeacherReportsPage(props: { searchParams: Promise<{ date?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const currentDate = searchParams.date || new Date().toISOString().split('T')[0]

  // Fetch reports for the selected date
  const { data: reports } = await supabase
    .from('teacher_daily_reports')
    .select(`
      id,
      date,
      created_at,
      teacher:profiles!teacher_id (
        id,
        full_name,
        email,
        avatar_url
      )
    `)
    .eq('date', currentDate)
    .order('created_at', { ascending: false })

  // Fetch attendance for the selected date
  const { data: attendanceRecords } = await supabase
    .from('daily_attendance')
    .select(`
      id,
      student_id,
      morning_status,
      afternoon_status,
      remarks,
      staff_id,
      student:profiles!student_id (
        full_name
      )
    `)
    .eq('date', currentDate)

  // Format reports to handle potential array from Supabase join
  const formattedReports = (reports || []).map((r: any) => ({
    ...r,
    teacher: Array.isArray(r.teacher) ? r.teacher[0] : r.teacher
  }))

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Link href="/admin/students" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
            &larr; Manage Students
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Daily Reports</h1>
        </div>
      </div>

      <TeacherReportsViewer 
        currentDate={currentDate} 
        reports={formattedReports} 
        attendanceRecords={attendanceRecords as any || []} 
      />
    </div>
  )
}
