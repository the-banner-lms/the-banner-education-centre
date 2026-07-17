'use client'

import Image from 'next/image'
import { useActionState, useEffect, useRef, useState } from 'react'
import { submitEnrollment, type EnrollmentFormState } from '@/app/actions/enrollmentActions'
import { PAYMENT_METHODS } from '@/lib/paymentMethods'
import { STUDENT_CLASSES, YLE_SUBCLASSES } from '@/lib/studentClasses'

const initialState: EnrollmentFormState = { status: 'idle', message: '' }
const inputClass = 'mt-2 min-h-12 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 outline-none focus:border-banner-dark focus-visible:ring-2 focus-visible:ring-banner-light/30'
const labelClass = 'block text-sm font-bold text-gray-800'

function PaymentQrPanel() {
  const paymentOptions = [
    { name: 'KBZPay', src: '/images/pay/kpay.png' },
    { name: 'WavePay', src: '/images/pay/wavepay.png' },
    { name: 'AYA Pay', src: '/images/pay/ayapay.png' },
  ]

  return (
    <details className="group overflow-hidden rounded-xl border border-banner-light/40 bg-banner-light/10">
      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-4 py-3 font-bold text-banner-dark marker:content-none sm:px-5">
        <span>Payment QR / Code Pay</span>
        <span aria-hidden="true" className="text-2xl transition-transform group-open:rotate-45">+</span>
      </summary>
      <div className="grid gap-4 border-t border-banner-light/30 bg-white p-4 sm:grid-cols-3 sm:p-5">
        {paymentOptions.map((option) => (
          <figure key={option.name} className="overflow-hidden rounded-xl border border-gray-200 bg-gray-50 p-3 text-center">
            <div className="relative mx-auto aspect-square w-full max-w-64 overflow-hidden rounded-lg bg-white">
              <Image src={option.src} alt={`${option.name} payment QR code`} fill sizes="(max-width: 640px) 256px, 220px" className="object-contain" />
            </div>
            <figcaption className="mt-3 font-bold text-banner-dark">{option.name}</figcaption>
          </figure>
        ))}
      </div>
    </details>
  )
}

export default function EnrollmentForm({ type }: { type: 'new_enrollment' | 'monthly_payment' }) {
  const [state, formAction, pending] = useActionState(submitEnrollment, initialState)
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const isNewEnrollment = type === 'new_enrollment'
  const fieldPrefix = isNewEnrollment ? 'enrollment' : 'monthly-payment'
  const isDirectPayment = selectedPaymentMethod === 'direct'

  useEffect(() => {
    if (state.status === 'success') {
      formRef.current?.reset()
      setSelectedClass('')
      setSelectedPaymentMethod('')
    }
  }, [state.status])

  return (
    <form ref={formRef} action={formAction} className="space-y-6">
      <input type="hidden" name="submission_type" value={type} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor={`${fieldPrefix}-website`}>Website</label>
        <input id={`${fieldPrefix}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div>
        <label htmlFor={`${fieldPrefix}-class`} className={labelClass}>Class</label>
        <select
          id={`${fieldPrefix}-class`}
          name="assigned_class"
          required
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className={inputClass}
        >
          <option value="" disabled>Choose a class</option>
          {STUDENT_CLASSES.map((studentClass) => (
            <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>
          ))}
        </select>
      </div>

      {selectedClass && selectedClass !== 'pre-kg' && (
        <div>
          <label htmlFor={`${fieldPrefix}-subclass`} className={labelClass}>YLE Dual / Sub-class</label>
          <select id={`${fieldPrefix}-subclass`} name="assigned_subclass" required={selectedClass === 'yle'} defaultValue="" className={inputClass}>
            <option value="">{selectedClass === 'yle' ? 'Choose a YLE sub-class' : 'No YLE'}</option>
            {YLE_SUBCLASSES.map((subclass) => (
              <option key={subclass.value} value={subclass.value}>{subclass.label}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor={`${fieldPrefix}-name`} className={labelClass}>Student Name (ကျောင်းသားအမည်)</label>
          <input id={`${fieldPrefix}-name`} name="student_name" required minLength={2} maxLength={100} autoComplete="name" placeholder="Enter student name" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${fieldPrefix}-email`} className={labelClass}>Email (Gmail)</label>
          <input id={`${fieldPrefix}-email`} name="email" type="email" required autoComplete="email" placeholder="student@gmail.com" className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${fieldPrefix}-contact`} className={labelClass}>Contact Number</label>
          <input id={`${fieldPrefix}-contact`} name="contact_number" type="tel" required autoComplete="tel" placeholder="09..." className={inputClass} />
        </div>
        <div>
          <label htmlFor={`${fieldPrefix}-viber`} className={labelClass}>Viber Number</label>
          <input id={`${fieldPrefix}-viber`} name="viber_number" type="tel" placeholder="09..." className={inputClass} />
        </div>
      </div>

      {isNewEnrollment ? (
        <div>
          <label htmlFor={`${fieldPrefix}-address`} className={labelClass}>Address (နေရပ်လိပ်စာ)</label>
          <textarea id={`${fieldPrefix}-address`} name="address" rows={3} maxLength={300} placeholder="Enter student address" className={inputClass} />
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldPrefix}-student-id`} className={labelClass}>Student ID</label>
            <input id={`${fieldPrefix}-student-id`} name="student_number" placeholder="primary3-2026-001" className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${fieldPrefix}-month`} className={labelClass}>Payment Month (သင်တန်းကြေးပေးသွင်းသောလ)</label>
            <input id={`${fieldPrefix}-month`} name="payment_month" type="month" required className={inputClass} />
          </div>
        </div>
      )}

      <fieldset className="rounded-2xl border border-green-200 bg-green-50/50 p-4 sm:p-5">
        <legend className="px-2 text-sm font-black uppercase tracking-[0.12em] text-banner-dark">Payment Details</legend>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor={`${fieldPrefix}-payment-method`} className={labelClass}>Payment Method</label>
            <select
              id={`${fieldPrefix}-payment-method`}
              name="payment_method"
              required
              value={selectedPaymentMethod}
              onChange={event => setSelectedPaymentMethod(event.target.value)}
              className={inputClass}
            >
              <option value="" disabled>Choose payment method</option>
              {PAYMENT_METHODS.map(method => <option key={method.value} value={method.value}>{method.label}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor={`${fieldPrefix}-payment-amount`} className={labelClass}>Amount (MMK)</label>
            <input id={`${fieldPrefix}-payment-amount`} name="payment_amount" type="number" inputMode="numeric" min="100" max="100000000" step="100" required placeholder="150000" className={inputClass} />
          </div>
          <div>
            <label htmlFor={`${fieldPrefix}-payment-date`} className={labelClass}>Payment Date</label>
            <input id={`${fieldPrefix}-payment-date`} name="payment_date" type="date" required className={inputClass} />
          </div>
          {!isDirectPayment && (
            <div>
              <label htmlFor={`${fieldPrefix}-transaction-id`} className={labelClass}>Transaction ID (Last 5 digits)</label>
              <input
                id={`${fieldPrefix}-transaction-id`}
                name="transaction_id"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{5}"
                minLength={5}
                maxLength={5}
                required
                autoComplete="off"
                placeholder="e.g. 48219"
                className={inputClass}
              />
              <p className="mt-1.5 text-xs font-medium text-gray-500">Enter only the final 5 digits shown on the payment slip.</p>
            </div>
          )}
        </div>
        {isDirectPayment && (
          <p className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
            Direct payment does not require a Transaction ID or payment slip. Admin will confirm the payment manually.
          </p>
        )}
      </fieldset>

      <div>
        <label htmlFor={`${fieldPrefix}-note`} className={labelClass}>Optional Note (admin ဖတ်ရန်)</label>
        <textarea id={`${fieldPrefix}-note`} name="note" rows={4} maxLength={1000} placeholder="Optional note for admin" className={inputClass} />
      </div>

      {!isDirectPayment && (
        <div>
          <label htmlFor={`${fieldPrefix}-slip`} className={labelClass}>Payment Slip</label>
          <input
            id={`${fieldPrefix}-slip`}
            name="payment_slip"
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="mt-2 block min-h-12 w-full cursor-pointer rounded-xl border border-gray-300 bg-white text-sm text-gray-700 file:mr-4 file:min-h-12 file:border-0 file:bg-banner-light/20 file:px-4 file:font-bold file:text-banner-dark hover:file:bg-banner-light/30"
          />
          <p className="mt-2 text-xs leading-5 text-gray-500">JPG, PNG, WebP or PDF — maximum 4 MB. Corrupt, blank, exact duplicate and reused transaction slips are rejected automatically. Unclear slips are sent to admin review.</p>
        </div>
      )}

      {!isDirectPayment && <PaymentQrPanel />}

      {state.message && (
        <div
          aria-live="polite"
          className={`rounded-xl border px-4 py-3 text-sm font-semibold ${state.status === 'success' ? 'border-green-200 bg-green-50 text-green-800' : 'border-red-200 bg-red-50 text-red-700'}`}
        >
          <p>{state.message}</p>
          {state.referenceCode && (
            <div className="mt-3 rounded-lg border border-green-200 bg-white p-3">
              <p className="text-xs font-black uppercase tracking-wide text-gray-600">Tracking Reference</p>
              <p className="mt-1 break-all font-mono text-base font-black text-banner-dark">{state.referenceCode}</p>
              <p className="mt-1 text-xs font-medium text-gray-600">Save this code. Use it with your email in “Check Submission Status” below.</p>
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-banner-dark px-7 py-3 font-bold text-white shadow-lg transition hover:bg-[#0b5226] focus:outline-none focus-visible:ring-4 focus-visible:ring-banner-light/50 disabled:cursor-wait disabled:opacity-65 sm:w-auto"
      >
        {pending ? 'Submitting…' : isNewEnrollment ? 'Submit Enrollment' : isDirectPayment ? 'Submit Direct Payment' : 'Submit Payment Slip'}
      </button>
    </form>
  )
}
