'use client'

import { useActionState, useEffect, useState } from 'react'
import {
  updateStudentDetails,
  type StudentAssignmentState,
} from '@/app/actions/studentActions'
import { STUDENT_CLASSES, YLE_SUBCLASSES } from '@/lib/studentClasses'

const initialState: StudentAssignmentState = { error: null, success: null }

export default function StudentAssignmentForm({
  studentId,
  assignedClass: initialClass,
  assignedSubclass,
  yleMonthlyFee,
  address,
  compact = false,
}: {
  studentId: string
  assignedClass?: string | null
  assignedSubclass?: string | null
  yleMonthlyFee?: number | string | null
  address?: string | null
  compact?: boolean
}) {
  const [selectedClass, setSelectedClass] = useState(initialClass || '')
  const [selectedSubclass, setSelectedSubclass] = useState(assignedSubclass || '')
  const action = updateStudentDetails.bind(null, studentId)
  const [state, formAction, pending] = useActionState(action, initialState)
  const allowsYle = selectedClass !== '' && selectedClass !== 'pre-kg'
  const requiresYle = selectedClass === 'yle'

  useEffect(() => {
    if (!allowsYle) setSelectedSubclass('')
  }, [allowsYle])

  return (
    <form
      action={formAction}
      className={compact
        ? 'grid min-w-0 gap-3 xl:grid-cols-[minmax(8rem,.6fr)_minmax(10rem,.75fr)_minmax(14rem,1.2fr)_auto] xl:items-end'
        : 'mt-5 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 sm:items-end'}
    >
      <div className="min-w-0">
        <label htmlFor={`assigned-class-${studentId}`} className={compact ? 'mb-1 block text-xs font-semibold text-gray-600' : 'block text-sm font-semibold text-gray-800'}>
          {compact ? 'Class' : 'Change Assigned Class'}
        </label>
        <select
          id={`assigned-class-${studentId}`}
          name="assigned_class"
          required
          value={selectedClass}
          onChange={(event) => setSelectedClass(event.target.value)}
          className={`${compact ? 'min-h-10 px-2 py-1.5 text-sm' : 'mt-2 min-h-11 px-3 py-2'} w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20`}
        >
          <option value="" disabled>Select a class</option>
          {STUDENT_CLASSES.map((studentClass) => (
            <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>
          ))}
        </select>
      </div>

      <div className="min-w-0">
        <label htmlFor={`assigned-subclass-${studentId}`} className={compact ? 'mb-1 block text-xs font-semibold text-gray-600' : 'block text-sm font-semibold text-gray-800'}>
          YLE Dual / Sub-class
        </label>
        <select
          id={`assigned-subclass-${studentId}`}
          name="assigned_subclass"
          required={requiresYle}
          disabled={!allowsYle}
          value={allowsYle ? selectedSubclass : ''}
          onChange={(event) => setSelectedSubclass(event.target.value)}
          className={`${compact ? 'min-h-10 px-2 py-1.5 text-sm' : 'mt-2 min-h-11 px-3 py-2'} w-full rounded-lg border border-gray-300 bg-white text-gray-900 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20`}
        >
          <option value="">{allowsYle ? 'No YLE / select a sub-class' : 'Not available for Pre-KG'}</option>
          {YLE_SUBCLASSES.map((subclass) => (
            <option key={subclass.value} value={subclass.value}>{subclass.label}</option>
          ))}
        </select>
      </div>

      {allowsYle && selectedSubclass && (
        <div className="min-w-0">
          <label htmlFor={`yle-monthly-fee-${studentId}`} className={compact ? 'mb-1 block text-xs font-semibold text-gray-600' : 'block text-sm font-semibold text-gray-800'}>
            YLE Tuition Fee (MMK)
          </label>
          <input
            id={`yle-monthly-fee-${studentId}`}
            name="yle_monthly_fee"
            type="number"
            inputMode="numeric"
            min="0"
            max="100000000"
            step="100"
            defaultValue={yleMonthlyFee ?? ''}
            placeholder="Use section default fee"
            className={`${compact ? 'min-h-10 px-3 py-1.5 text-sm' : 'mt-2 min-h-11 px-3 py-2'} w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20`}
          />
          {!compact && <p className="mt-1 text-xs text-gray-500">Leave blank to use the YLE section fee from Academic Setup.</p>}
        </div>
      )}

      <div className="min-w-0">
        <label htmlFor={`address-${studentId}`} className={compact ? 'mb-1 block text-xs font-semibold text-gray-600' : 'block text-sm font-semibold text-gray-800'}>Address</label>
        <input
          id={`address-${studentId}`}
          name="address"
          type="text"
          required
          minLength={3}
          maxLength={300}
          defaultValue={address || ''}
          autoComplete="street-address"
          placeholder="Enter student address"
          className={`${compact ? 'min-h-10 px-3 py-1.5 text-sm' : 'mt-2 min-h-11 px-3 py-2'} w-full rounded-lg border border-gray-300 bg-white text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20`}
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className={`${compact ? 'min-h-10 px-4 py-1.5' : 'min-h-11 px-5 py-2.5 sm:col-span-2 sm:justify-self-end'} shrink-0 rounded-lg bg-[#0f6630] text-sm font-semibold text-white hover:bg-[#0b5226] disabled:cursor-not-allowed disabled:opacity-60`}
      >
        {pending ? 'Saving…' : compact ? 'Save' : 'Save Assignment & Address'}
      </button>

      {(state.error || state.success) && (
        <p
          role="status"
          className={`${compact ? 'xl:col-span-4' : 'sm:col-span-2'} rounded-lg border px-3 py-2 text-sm font-semibold ${state.error ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-800'}`}
        >
          {state.error || state.success}
        </p>
      )}
    </form>
  )
}
