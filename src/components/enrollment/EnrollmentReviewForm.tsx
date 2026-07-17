'use client'

import { useActionState, useState } from 'react'
import { updateEnrollmentStatus, type EnrollmentReviewState } from '@/app/actions/enrollmentActions'

const initialState: EnrollmentReviewState = { status: 'idle', message: '' }

const rejectionTemplates = [
  'Duplicate slip or transaction ID.',
  'Payment amount does not match the submitted amount.',
  'Wrong receiver or payment account.',
  'Transaction ID is unreadable.',
  'Payment slip image is invalid or unclear.',
  'Payment date is outside the accepted period.',
]

export default function EnrollmentReviewForm({
  submissionId,
  submissionType,
  currentStatus,
  currentReason,
}: {
  submissionId: string
  submissionType: 'new_enrollment' | 'monthly_payment'
  currentStatus: 'pending' | 'contacted' | 'completed' | 'rejected'
  currentReason: string | null
}) {
  const reviewAction = updateEnrollmentStatus.bind(null, submissionId)
  const [state, formAction, pending] = useActionState(reviewAction, initialState)
  const [selectedStatus, setSelectedStatus] = useState(currentStatus)
  const [reason, setReason] = useState(currentReason || '')

  return (
    <form action={formAction} className="w-full space-y-2 sm:max-w-xl">
      <div className="grid gap-2 sm:grid-cols-[10rem_1fr_auto]">
        <div>
          <label htmlFor={`status-${submissionId}`} className="sr-only">Review status</label>
          <select id={`status-${submissionId}`} name="status" value={selectedStatus} onChange={event => setSelectedStatus(event.target.value as typeof selectedStatus)} className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-semibold text-gray-800">
            <option value="pending">Pending Review</option>
            <option value="contacted">Contacted</option>
            <option value="completed">{submissionType === 'new_enrollment' ? 'Approve & Create Student' : 'Verified'}</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
        <div>
          <label htmlFor={`reason-template-${submissionId}`} className="sr-only">Rejection reason template</label>
          <select id={`reason-template-${submissionId}`} defaultValue="" onChange={event => event.target.value && setReason(event.target.value)} className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-700">
            <option value="">Choose notice template…</option>
            {rejectionTemplates.map(template => <option key={template} value={template}>{template}</option>)}
          </select>
        </div>
        <button type="submit" disabled={pending} className="min-h-10 rounded-lg bg-banner-dark px-4 text-sm font-bold text-white hover:bg-[#0b5226] disabled:cursor-wait disabled:opacity-60">
          {pending ? 'Saving…' : selectedStatus === 'completed' && submissionType === 'new_enrollment' ? 'Approve Student' : 'Save Review'}
        </button>
      </div>
      <label htmlFor={`review-reason-${submissionId}`} className="sr-only">Admin notice</label>
      <textarea
        id={`review-reason-${submissionId}`}
        name="review_reason"
        rows={2}
        minLength={selectedStatus === 'rejected' ? 5 : undefined}
        maxLength={500}
        required={selectedStatus === 'rejected'}
        value={reason}
        onChange={event => setReason(event.target.value)}
        placeholder={selectedStatus === 'rejected' ? 'Rejection reason is required. The applicant will see this notice.' : 'Optional admin notice visible to the applicant'}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 outline-none focus:border-banner-dark focus:ring-2 focus:ring-banner-light/30"
      />
      {state.message && <p aria-live="polite" className={`text-xs font-semibold ${state.status === 'success' ? 'text-green-700' : 'text-red-700'}`}>{state.message}</p>}
    </form>
  )
}
