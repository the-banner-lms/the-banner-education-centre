import Link from 'next/link'
import { updateEnrollmentStatus } from '@/app/actions/enrollmentActions'
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
  payment_month: string | null
  note: string | null
  status: 'pending' | 'contacted' | 'completed' | 'rejected'
  created_at: string
  payment_slip_url: string | null
}

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
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ring-1 ring-inset ${statusStyles[submission.status]}`}>
                  {submission.status}
                </span>
              </div>
              <p className="mt-1 text-xs font-medium text-gray-500">
                {submission.submission_type === 'new_enrollment' ? 'New Enrollment' : 'Monthly Payment'} · {formatDate(submission.created_at)}
              </p>
            </div>
            <form action={updateEnrollmentStatus.bind(null, submission.id)} className="flex w-full gap-2 sm:w-auto">
              <label htmlFor={`status-${submission.id}`} className="sr-only">Status</label>
              <select id={`status-${submission.id}`} name="status" defaultValue={submission.status} className="min-h-10 min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-800 sm:w-36">
                <option value="pending">Pending</option>
                <option value="contacted">Contacted</option>
                <option value="completed">Completed</option>
                <option value="rejected">Rejected</option>
              </select>
              <button type="submit" className="min-h-10 rounded-lg bg-banner-dark px-4 text-sm font-bold text-white hover:bg-[#0b5226]">Save</button>
            </form>
          </div>

          <div className="grid gap-x-8 gap-y-5 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-500">Class</p>
              <p className="mt-1 font-semibold text-gray-900">
                {getStudentClassLabel(submission.assigned_class)}
                {submission.assigned_class === 'yle' ? ` · ${getYleSubclassLabel(submission.assigned_subclass)}` : ''}
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
              {submission.payment_month && <p className="mt-1 text-sm text-gray-800">Month: {submission.payment_month}</p>}
              {submission.payment_slip_url ? (
                <Link href={submission.payment_slip_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-9 items-center rounded-lg bg-green-50 px-3 py-1.5 text-sm font-bold text-banner-dark ring-1 ring-inset ring-green-200 hover:bg-green-100">
                  View Payment Slip
                </Link>
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
