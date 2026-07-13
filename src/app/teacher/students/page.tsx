import { createClient } from '@/utils/supabase/server'
import StudentDirectory from '@/components/students/StudentDirectory'

export const dynamic = 'force-dynamic'

export default async function TeacherStudentsPage() {
  const supabase = await createClient()

  // Fetch only students
  const { data: students, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  if (error) {
    return <div>Error loading students.</div>
  }

  return <StudentDirectory students={students || []} basePath="/teacher/students" title="My Students" />
}
