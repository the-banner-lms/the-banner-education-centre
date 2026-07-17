import Link from 'next/link'
import EnrollmentReviewForm from '@/components/enrollment/EnrollmentReviewForm'
import { getPaymentMethodLabel } from '@/lib/paymentMethods'
import { getStudentClassLabel, getYleSubclassLabel } from '@/lib/studentClasses'

export type EnrollmentSubmission = {
  id: string
  submission_type: 'new_enrollment' | 'monthly_payment'
  assigned_class: string
  assigned_subclass: string | null
  student_name: string
  email: string
  contact_number: string
  viber_number: string | null
  address: string | null
  student_number: string | null
  student_profile_id: string | null
  payment_month: string | null
  payment_method: string | null
  payment_amount: number | string | null
  payment_date: string | null
  transaction_id: string | null
  note: string | null
  status: 'pending' | 'contacted' | 'completed' | 'rejected'
  tracking_code: string
  slip_mime_type: string | null
  slip_size_bytes: number | null
  slip_width: number | null
  slip_height: number | null
  validation_status: 'clear' | 'needs_review' | 'blocked'
  validation_flags: string[] | null
  review_reason: string | null
  reviewed_at: string | null
  created_at: string
  payment_slip_url: string | null
}

const statusLabels = {
  pending: 'Pending Review',
  contacted: 'Contacted',
  completed: 'Verified',
  rejected: 'Rejected',
}

const validationStyles = {
  clear: 'bg-green-50 text-green-800 ring-green-200',
  needs_review: 'bg-amber-50 text-amber-800 ring-amber-200',
  blocked: 'bg-red-50 text-red-800 ring-red-200',
}

const validationLabels = {
  clear: 'Automatic Checks Clear',
  needs_review: 'Needs Manual Review',
  blocked: 'Upload Blocked',
}

const validationFlagLabels: Record<string, string> = {
  direct_payment_no_slip: 'Direct payment — no slip required',
  pdf_requires_manual_review: 'PDF requires visual review',
  low_resolution: 'Low-resolution image',
  low_detail: 'Image may be unclear',
  possible_near_duplicate: 'Possible edited/cropped duplicate',
  payment_date_older_than_7_days: 'Payment date is older than 7 days',
  payment_date_in_future: 'Payment date is in the future',
}

const amountFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

const statusStyles = {
  pending: 'bg-amber-50 text-amber-800 ring-amber-200',
  contacted: 'bg-blue-50 text-blue-800 ring-blue-200',
  completed: 'bg-green-50 text-green-800 ring-green-200',
  rejected: 'bg-red-50 text-red-800 ring-red-200',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Yangon',
  }).format(new Date(value))
}

function formatPaymentDate(value: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'Asia/Yangon',
  }).format(new Date(`${value}T00:00:00+06:30`))
}

export default function EnrollmentSubmissionsList({ submissions }: { submissions: EnrollmentSubmission[] }) {
  if (!submissions.length) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <p className="font-semibold text-gray-700">No enrollment submissions found.</p>
        <p className="mt-2 text-sm text-gray-500">New public form submissions will appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <article key={submission.id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-gray-100 bg-gray-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-gray-900">{submission.student_name}</h2>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[submission.status]}`}>
                  {statusLabels[submission.status]}
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${validationStyles[submission.validation_status]}`}>
                  {validationLabels[submission.validation_status]}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {submission.submission_type === 'new_enrollment' ? 'New Enrollment' : 'Monthly Payment'} · {formatDate(submission.created_at)}
              </p>
            </div>
            <EnrollmentReviewForm submissionId={submission.id} submissionType={submission.submission_type} currentStatus={submission.status} currentReason={submission.review_reason} />
          </div>

          <div className="grid gap-x-8 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Class</p>
              <p className="mt-1 font-semibold text-gray-900">
                {getStudentClassLabel(submission.assigned_class)}
                {submission.assigned_subclass ? ` · YLE ${getYleSubclassLabel(submission.assigned_subclass)}` : ''}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Contact</p>
              <p className="mt-1 break-all text-sm text-gray-800">{submission.email}</p>
              <p className="mt-1 text-sm text-gray-800">Phone: {submission.contact_number}</p>
              {submission.viber_number && <p className="mt-1 text-sm text-gray-800">Viber: {submission.viber_number}</p>}
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Payment</p>
              {submission.student_number && <p className="mt-1 text-sm text-gray-800">Student ID: {submission.student_number}</p>}
              {submission.student_profile_id && (
                <Link href={`/admin/students/${submission.student_profile_id}`} className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-bold text-blue-800 ring-1 ring-inset ring-blue-200 hover:bg-blue-100">
                  Open Student Profile
                </Link>
              )}
              {submission.payment_month && <p className="mt-1 text-sm text-gray-800">Month: {submission.payment_month}</p>}
              <p className="mt-1 text-sm text-gray-800">Method: {getPaymentMethodLabel(submission.payment_method)}</p>
              {submission.payment_amount && <p className="mt-1 text-sm font-bold text-gray-900">Claimed amount: {amountFormatter.format(Number(submission.payment_amount))} MMK</p>}
              {submission.payment_date && <p className="mt-1 text-sm text-gray-800">Payment date: {formatPaymentDate(submission.payment_date)}</p>}
              {submission.transaction_id && <p className="mt-1 break-all text-sm text-gray-800">Transaction ID: <span className="font-mono font-semibold">{submission.transaction_id}</span></p>}
              {submission.payment_slip_url ? (
                <Link href={submission.payment_slip_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-green-50 px-3 py-1.5 text-sm font-bold text-banner-dark ring-1 ring-inset ring-green-200 hover:bg-green-100">
                  View Payment Slip
                </Link>
              ) : submission.payment_method === 'direct' ? (
                <p className="mt-2 text-sm font-semibold text-blue-700">No slip required for direct payment</p>
              ) : (
                <p className="mt-2 text-sm text-red-600">Slip unavailable</p>
              )}
            </div>
            {submission.address && (
              <div className="sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Address</p>
                <p className="mt-1 text-sm leading-6 text-gray-800">{submission.address}</p>
              </div>
            )}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2 lg:col-span-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Automatic Slip Checks</p>
                  <p className="mt-1 text-sm font-semibold text-gray-800">Reference: <span className="break-all font-mono">{submission.tracking_code}</span></p>
                </div>
                <p className="text-xs font-semibold text-gray-600">
                  {submission.slip_width && submission.slip_height ? `${submission.slip_width}×${submission.slip_height}px · ` : ''}
                  {submission.slip_size_bytes ? `${Math.max(1, Math.round(submission.slip_size_bytes / 1024))} KB · ` : ''}
                  {submission.slip_mime_type || 'Legacy upload'}
                </p>
              </div>
              {submission.validation_flags?.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {submission.validation_flags.map(flag => (
                    <li key={flag} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">{validationFlagLabels[flag] || flag.replaceAll('_', ' ')}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm font-semibold text-green-700">No automatic risk flags detected. Admin visual verification is still required.</p>
              )}
            </div>
            {submission.review_reason && (
              <div className={`rounded-xl border p-4 sm:col-span-2 lg:col-span-3 ${submission.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-blue-200 bg-blue-50'}`}>
                <p className="text-xs font-bold uppercase tracking-wide text-gray-700">Applicant Notice</p>
                <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-800">{submission.review_reason}</p>
                {submission.reviewed_at && <p className="mt-2 text-xs text-gray-600">Reviewed {formatDate(submission.reviewed_at)}</p>}
              </div>
            )}
            {submission.note && (
              <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 sm:col-span-2 lg:col-span-3">
                <p className="text-xs font-bold uppercase tracking-wide text-amber-800">Note</p>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-800">{submission.note}</p>
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}
