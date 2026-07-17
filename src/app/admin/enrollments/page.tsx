import type { Metadata } from 'next'
import Link from 'next/link'
import EnrollmentSubmissionsList, { type EnrollmentSubmission } from '@/components/enrollment/EnrollmentSubmissionsList'
import { supabaseAdmin } from '@/utils/supabase/admin'

export const metadata: Metadata = { title: 'Enrollment Submissions | Admin' }
export const dynamic = 'force-dynamic'

const submissionTypes = ['all', 'new_enrollment', 'monthly_payment'] as const
const statuses = ['all', 'pending', 'contacted', 'completed', 'rejected'] as const

export default async function AdminEnrollmentsPage(props: {
  searchParams: Promise<{ type?: string; status?: string }>
}) {
  const searchParams = await props.searchParams
  const selectedType = submissionTypes.includes(searchParams.type as typeof submissionTypes[number]) ? searchParams.type! : 'all'
  const selectedStatus = statuses.includes(searchParams.status as typeof statuses[number]) ? searchParams.status! : 'all'

  let query = supabaseAdmin
    .from('enrollment_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (selectedType !== 'all') query = query.eq('submission_type', selectedType)
  if (selectedStatus !== 'all') query = query.eq('status', selectedStatus)

  const { data, error } = await query
  if (error) console.error('Failed to load enrollment submissions:', error)

  const submissions = await Promise.all((data || []).map(async (submission) => {
    const { data: signedData } = await supabaseAdmin.storage
      .from('enrollment-slips')
      .createSignedUrl(submission.payment_slip_path, 3600)

    return {
      ...submission,
      payment_slip_url: signedData?.signedUrl || null,
    } as EnrollmentSubmission
  }))

  const filterLink = (type: string, status: string) => `/admin/enrollments?type=${type}&status=${status}`

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-banner-dark">Admissions & Payments</p>
          <h1 className="mt-2 text-3xl font-black text-gray-900">Enrollment Submissions</h1>
          <p className="mt-2 text-sm text-gray-600">Review public enrollment forms and monthly payment slips.</p>
        </div>
        <Link href="/enrollment" target="_blank" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-banner-dark px-4 py-2 text-sm font-bold text-banner-dark hover:bg-green-50">
          Open Public Form
        </Link>
      </div>

      <div className="mb-6 space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {submissionTypes.map((type) => (
            <Link key={type} href={filterLink(type, selectedStatus)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold ${selectedType === type ? 'bg-banner-dark text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {type === 'all' ? 'All Types' : type === 'new_enrollment' ? 'New Enrollment' : 'Monthly Payment'}
            </Link>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {statuses.map((status) => (
            <Link key={status} href={filterLink(selectedType, status)} className={`shrink-0 rounded-full px-3 py-2 text-sm font-bold capitalize ${selectedStatus === status ? 'bg-banner-brown text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {status === 'all' ? 'All Statuses' : status}
            </Link>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">Unable to load submissions.</p>}
      <EnrollmentSubmissionsList submissions={submissions} />
    </div>
  )
}
