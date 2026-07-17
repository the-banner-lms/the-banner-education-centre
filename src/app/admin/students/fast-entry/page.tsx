import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import FastEntryTable from '@/components/students/FastEntryTable'

export const metadata = {
  title: 'Fast Entry | Admin',
}

export const dynamic = 'force-dynamic'

function getCurrentMyanmarMonth() {
  const now = new Date()
  now.setMinutes(now.getMinutes() + 390)
  return now.toISOString().slice(0, 7)
}

export default async function AdminFastEntryPage(props: { searchParams: Promise<{ month?: string }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
    redirect('/dashboard')
  }

  const currentMonthYear = getCurrentMyanmarMonth()
  const selectedMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(searchParams.month || '')
    ? searchParams.month!
    : currentMonthYear

  // Fetch all students
  const { data: students } = await supabase
    .from('profiles')
    .select('id, full_name, email, student_number, assigned_class, address')
    .eq('role', 'student')
    .order('assigned_class')
    .order('full_name')

  const { data: existingTuition } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('month_year', selectedMonth)

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <Link href="/admin/students" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
            &larr; Manage Students
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Monthly Payment Data Entry</h1>
        </div>
      </div>

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Enter monthly fees, remarks and Paid / Unpaid / Scholar status. Class totals and the monthly summary update automatically.
            </p>
          </div>
        </div>
      </div>

      <FastEntryTable 
        students={students || []} 
        monthYear={selectedMonth}
        existingTuition={existingTuition || []}
        basePath="/admin/students/fast-entry"
      />
    </div>
  )
}
