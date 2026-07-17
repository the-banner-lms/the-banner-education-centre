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
    .select('id, full_name, email, student_number, assigned_class, assigned_subclass, address, approval_status')
    .eq('role', 'student')
    .order('assigned_class')
    .order('full_name')

  const { data: existingTuition } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('month_year', selectedMonth)

  return (
    <div className="mx-auto max-w-7xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col items-start gap-2">
          <Link href="/admin/students" className="text-indigo-600 hover:text-indigo-800 mr-4 font-medium flex items-center">
            &larr; Manage Students
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Monthly Payment Data Entry</h1>
          <p className="text-sm text-gray-600">Every student account appears here immediately, including newly created and pending accounts.</p>
        </div>
        <Link
          href="/admin/enrollments?type=monthly_payment&status=all&class=all"
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-banner-dark bg-white px-4 py-2.5 text-sm font-bold text-banner-dark hover:bg-green-50"
        >
          Review Payment Submissions
        </Link>
      </div>

      <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              Enter Base and YLE fees separately with one Paid / Unpaid / Scholar status. Per-class and monthly accounting totals update automatically.
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
