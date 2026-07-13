import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FastEntryTable from '@/components/students/FastEntryTable'

export const metadata = {
  title: 'Fast Entry | Staff',
}

export const dynamic = 'force-dynamic'

export default async function StaffFastEntryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'staff') {
    redirect('/dashboard')
  }

  const today = new Date().toISOString().split('T')[0]
  const currentMonthYear = today.substring(0, 7)

  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, avatar_url')
    .eq('role', 'student')
    .order('full_name')

  const { data: existingAttendance } = await supabase
    .from('daily_attendance')
    .select('*')
    .eq('date', today)

  const { data: existingTuition } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('month_year', currentMonthYear)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/staff/students" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
            &larr; Manage Students
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Fast Data Entry</h1>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Update attendance and tuition fees for all students at once. Changes made here will instantly sync to the individual student dashboards.
            </p>
          </div>
        </div>
      </div>

      <FastEntryTable 
        students={students || []} 
        initialDate={today} 
        initialMonthYear={currentMonthYear}
        existingAttendance={existingAttendance || []}
        existingTuition={existingTuition || []}
      />
    </div>
  )
}
