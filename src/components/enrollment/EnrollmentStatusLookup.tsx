'use client'

import { useActionState } from 'react'
import { checkEnrollmentStatus, type EnrollmentLookupState } from '@/app/actions/enrollmentActions'

const initialState: EnrollmentLookupState = { status: 'idle', message: '' }
const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-banner-dark focus:ring-4 focus:ring-banner-light/20'

const statusLabels = {
  pending: 'Pending Admin Review',
  contacted: 'Admin Contacted',
  completed: 'Verified',
  rejected: 'Rejected',
}

const statusStyles = {
  pending: 'border-amber-200 bg-amber-50 text-amber-900',
  contacted: 'border-blue-200 bg-blue-50 text-blue-900',
  completed: 'border-green-200 bg-green-50 text-green-900',
  rejected: 'border-red-200 bg-red-50 text-red-900',
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

export default function EnrollmentStatusLookup() {
  const [state, formAction, pending] = useActionState(checkEnrollmentStatus, initialState)

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="max-w-2xl">
        <p className="text-sm font-black uppercase tracking-[0.14em] text-banner-dark">Admin Decision Notice</p>
        <h2 className="mt-2 text-2xl font-black text-banner-brown sm:text-3xl">Check Submission Status</h2>
        <p className="mt-2 text-sm leading-6 text-gray-600">Use the tracking reference and the same email address submitted with the form.</p>
      </div>

      <form action={formAction} className="mt-6 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="absolute -left-[9999px]" aria-hidden="true">
          <label htmlFor="lookup-website">Website</label>
          <input id="lookup-website" name="lookup_website" tabIndex={-1} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="reference-code" className="block text-sm font-bold text-gray-800">Tracking Reference</label>
          <input id="reference-code" name="reference_code" required minLength={32} maxLength={32} autoComplete="off" placeholder="32-character reference" className={inputClass} />
        </div>
        <div>
          <label htmlFor="lookup-email" className="block text-sm font-bold text-gray-800">Submission Email</label>
          <input id="lookup-email" name="lookup_email" type="email" required autoComplete="email" placeholder="student@gmail.com" className={inputClass} />
        </div>
        <button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-banner-dark px-5 py-3 text-sm font-bold text-white hover:bg-[#0b5226] disabled:cursor-wait disabled:opacity-60">
          {pending ? 'Checking…' : 'Check Status'}
        </button>
      </form>

      {state.status === 'error' && <p aria-live="polite" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">{state.message}</p>}

      {state.status === 'success' && state.submission && (
        <div aria-live="polite" className={`mt-5 rounded-xl border p-4 sm:p-5 ${statusStyles[state.submission.status]}`}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-wide">Current Status</p>
              <p className="mt-1 text-xl font-black">{statusLabels[state.submission.status]}</p>
            </div>
            <p className="text-sm font-semibold">Submitted {formatDate(state.submission.submittedAt)}</p>
          </div>
          <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <p><span className="font-black">Student:</span> {state.submission.studentName}</p>
            <p><span className="font-black">Type:</span> {state.submission.submissionType === 'new_enrollment' ? 'New Enrollment' : 'Monthly Payment'}</p>
            {state.submission.paymentMonth && <p><span className="font-black">Payment Month:</span> {state.submission.paymentMonth}</p>}
            {state.submission.reviewedAt && <p><span className="font-black">Reviewed:</span> {formatDate(state.submission.reviewedAt)}</p>}
          </div>
          {state.submission.reviewReason && (
            <div className="mt-4 rounded-lg bg-white/75 p-4">
              <p className="text-xs font-black uppercase tracking-wide">Admin Notice</p>
              <p className="mt-1 whitespace-pre-wrap text-sm font-semibold leading-6">{state.submission.reviewReason}</p>
            </div>
          )}
          {state.submission.status === 'rejected' && <p className="mt-4 text-sm font-bold">Correct the issue above and submit a new slip using the form.</p>}
        </div>
      )}
    </div>
  )
}
