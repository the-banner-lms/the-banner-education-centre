'use client'

import Link from 'next/link'
import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import {
  createManualStudent,
  type ManualStudentState,
} from '@/app/actions/studentActions'
import { STUDENT_CLASSES } from '@/lib/studentClasses'

const initialState: ManualStudentState = { error: null }

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#0f6630] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#0b5226] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0f6630] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? 'Creating Student…' : 'Create Student'}
    </button>
  )
}

export default function ManualStudentForm({ basePath }: { basePath: '/admin/students' | '/staff/students' }) {
  const [state, formAction] = useActionState(createManualStudent, initialState)

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link href={basePath} className="text-sm font-semibold text-[#0f6630] hover:underline">
          ← Back to Students
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">Add Student Manually</h1>
        <p className="mt-2 text-sm leading-6 text-gray-600">
          This creates the student profile and a login account at the same time.
        </p>
      </div>

      <form action={formAction} className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <input type="hidden" name="base_path" value={basePath} />

        {state.error && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {state.error}
          </div>
        )}

        <div>
          <label htmlFor="full_name" className="block text-sm font-semibold text-gray-800">Full Name</label>
          <input
            id="full_name"
            name="full_name"
            type="text"
            required
            maxLength={100}
            autoComplete="name"
            placeholder="Student full name"
            className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-gray-800">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="student@example.com"
            className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-semibold text-gray-800">Address</label>
          <textarea
            id="address"
            name="address"
            required
            minLength={3}
            maxLength={300}
            rows={3}
            autoComplete="street-address"
            placeholder="Student home address"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-800">Temporary Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
            />
          </div>
          <div>
            <label htmlFor="confirm_password" className="block text-sm font-semibold text-gray-800">Confirm Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
            />
          </div>
        </div>

        <p className="-mt-3 text-xs leading-5 text-gray-500">
          Use at least 8 characters. Give this temporary password to the student securely.
        </p>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="assigned_class" className="block text-sm font-semibold text-gray-800">Assigned Class</label>
            <select
              id="assigned_class"
              name="assigned_class"
              required
              defaultValue=""
              className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
            >
              <option value="" disabled>Select a class</option>
              {STUDENT_CLASSES.map((studentClass) => (
                <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>
              ))}
            </select>
          </div>
          <div>
          <label htmlFor="approval_status" className="block text-sm font-semibold text-gray-800">Account Status</label>
          <select
            id="approval_status"
            name="approval_status"
            defaultValue="approved"
            className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 outline-none transition focus:border-[#0f6630] focus:ring-2 focus:ring-[#0f6630]/20"
          >
            <option value="approved">Approved — can use the student dashboard</option>
            <option value="pending">Pending — wait for approval</option>
          </select>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-end">
          <Link
            href={basePath}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Cancel
          </Link>
          <SubmitButton />
        </div>
      </form>
    </div>
  )
}
