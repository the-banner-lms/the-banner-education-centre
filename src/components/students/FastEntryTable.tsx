'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkSaveMonthlyTuition, type TuitionEntry } from '@/app/actions/fastEntryActions'
import { getStudentClassLabel, STUDENT_CLASSES } from '@/lib/studentClasses'

type Student = {
  id: string
  full_name: string | null
  email: string
  student_number: string | null
  assigned_class: string | null
  address: string | null
}

type ExistingTuition = {
  student_id: string
  month_year: string
  status: 'paid' | 'unpaid' | 'scholar'
  amount: number | string | null
  remarks: string | null
}

type Props = {
  students: Student[]
  monthYear: string
  existingTuition: ExistingTuition[]
  basePath: string
}

const currency = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })

function formatAmount(value: number) {
  return `${currency.format(value)} MMK`
}

export default function FastEntryTable({ students, monthYear, existingTuition, basePath }: Props) {
  const router = useRouter()
  const [isMonthPending, startMonthTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [classFilter, setClassFilter] = useState('all')
  const [tuitionState, setTuitionState] = useState<Record<string, TuitionEntry>>({})

  useEffect(() => {
    const nextState: Record<string, TuitionEntry> = {}
    students.forEach((student) => {
      const existing = existingTuition.find(record => record.student_id === student.id)
      nextState[student.id] = {
        student_id: student.id,
        status: existing?.status || 'unpaid',
        amount: Number(existing?.amount || 0),
        remarks: existing?.remarks || '',
        recorded: Boolean(existing),
      }
    })
    setTuitionState(nextState)
    setHasChanges(false)
    setMessage(null)
  }, [students, existingTuition, monthYear])

  const updateTuition = (studentId: string, field: 'status' | 'amount' | 'remarks', value: string) => {
    setTuitionState(previous => ({
      ...previous,
      [studentId]: {
        ...previous[studentId],
        [field]: field === 'amount' ? Number(value || 0) : value,
        recorded: true,
      } as TuitionEntry,
    }))
    setHasChanges(true)
    setMessage(null)
  }

  const summaries = useMemo(() => STUDENT_CLASSES.map(studentClass => {
    const classStudents = students.filter(student => student.assigned_class === studentClass.value)
    const entries = classStudents
      .map(student => tuitionState[student.id])
      .filter((entry): entry is TuitionEntry => Boolean(entry))
      .filter(entry => entry.recorded || entry.amount > 0 || entry.status !== 'unpaid' || Boolean(entry.remarks))
    const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
    const paid = entries.filter(entry => entry.status === 'paid')
    const unpaid = entries.filter(entry => entry.status === 'unpaid')
    const scholars = entries.filter(entry => entry.status === 'scholar')

    return {
      value: studentClass.value,
      label: studentClass.label,
      studentCount: classStudents.length,
      recordedCount: entries.length,
      total,
      collected: paid.reduce((sum, entry) => sum + entry.amount, 0),
      outstanding: unpaid.reduce((sum, entry) => sum + entry.amount, 0),
      waived: scholars.reduce((sum, entry) => sum + entry.amount, 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      scholarCount: scholars.length,
    }
  }), [students, tuitionState])

  const overall = useMemo(() => summaries.reduce((result, summary) => ({
    studentCount: result.studentCount + summary.studentCount,
    recordedCount: result.recordedCount + summary.recordedCount,
    total: result.total + summary.total,
    collected: result.collected + summary.collected,
    outstanding: result.outstanding + summary.outstanding,
    waived: result.waived + summary.waived,
    paidCount: result.paidCount + summary.paidCount,
    unpaidCount: result.unpaidCount + summary.unpaidCount,
    scholarCount: result.scholarCount + summary.scholarCount,
  }), {
    studentCount: 0,
    recordedCount: 0,
    total: 0,
    collected: 0,
    outstanding: 0,
    waived: 0,
    paidCount: 0,
    unpaidCount: 0,
    scholarCount: 0,
  }), [summaries])

  const collectionBase = overall.collected + overall.outstanding
  const collectionRate = collectionBase > 0 ? Math.round((overall.collected / collectionBase) * 100) : 0
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(`${monthYear}-01T00:00:00Z`))
  const autoRemark = `${monthLabel}: ${overall.recordedCount} payment records. Paid ${overall.paidCount} (${formatAmount(overall.collected)} collected), unpaid ${overall.unpaidCount} (${formatAmount(overall.outstanding)} outstanding), scholar ${overall.scholarCount} (${formatAmount(overall.waived)} waived). Collection rate ${collectionRate}%.`

  const visibleStudents = classFilter === 'all'
    ? students
    : students.filter(student => student.assigned_class === classFilter)

  const handleMonthChange = (value: string) => {
    if (!value || value === monthYear) return
    startMonthTransition(() => {
      router.replace(`${basePath}?month=${encodeURIComponent(value)}`)
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    setMessage(null)
    try {
      const result = await bulkSaveMonthlyTuition(monthYear, Object.values(tuitionState))
      if (result.error) {
        setMessage({ type: 'error', text: result.error })
      } else {
        setMessage({ type: 'success', text: `${result.savedCount || 0} monthly payment records saved. Student dashboards are synced.` })
        setHasChanges(false)
        router.refresh()
      }
    } catch {
      setMessage({ type: 'error', text: 'Unable to save monthly payment records.' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-green-200 bg-gradient-to-br from-[#0f6630] to-[#08451f] p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-100">All Classes Total · {monthLabel}</p>
            <p className="mt-2 text-3xl font-black sm:text-4xl">{formatAmount(overall.total)}</p>
            <p className="mt-2 text-sm text-green-100">{overall.recordedCount} recorded / {overall.studentCount} students</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs text-green-100">Collected</p><p className="mt-1 font-bold">{formatAmount(overall.collected)}</p></div>
            <div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs text-green-100">Outstanding</p><p className="mt-1 font-bold">{formatAmount(overall.outstanding)}</p></div>
            <div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs text-green-100">Scholar</p><p className="mt-1 font-bold">{formatAmount(overall.waived)}</p></div>
            <div className="rounded-xl bg-white/10 px-4 py-3"><p className="text-xs text-green-100">Collection Rate</p><p className="mt-1 font-bold">{collectionRate}%</p></div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900">Class Totals</h2>
            <p className="text-sm text-gray-500">Live totals update as amounts and statuses change.</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-5">
          {summaries.map(summary => (
            <button
              key={summary.value}
              type="button"
              onClick={() => setClassFilter(classFilter === summary.value ? 'all' : summary.value)}
              className={`rounded-xl border p-3 text-left transition ${classFilter === summary.value ? 'border-banner-dark bg-green-50 ring-2 ring-banner-light/40' : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'}`}
            >
              <span className="block text-sm font-black text-gray-900">{summary.label}</span>
              <span className="mt-2 block text-base font-black text-banner-dark">{formatAmount(summary.total)}</span>
              <span className="mt-1 block text-xs text-gray-500">Paid {summary.paidCount} · Unpaid {summary.unpaidCount} · Scholar {summary.scholarCount}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Auto-generated Monthly Remark</p>
        <p className="mt-2 text-sm font-medium leading-6 text-gray-800">{autoRemark}</p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <div>
              <label htmlFor="tuition-month" className="mb-1 block text-sm font-bold text-gray-700">Tuition Month</label>
              <input id="tuition-month" type="month" value={monthYear} onChange={event => handleMonthChange(event.target.value)} disabled={isMonthPending || hasChanges} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-gray-900 disabled:cursor-not-allowed disabled:opacity-60" />
              {hasChanges && <p className="mt-1 text-xs text-amber-700">Save changes before switching month.</p>}
            </div>
            <div>
              <label htmlFor="class-filter" className="mb-1 block text-sm font-bold text-gray-700">Class Filter</label>
              <select id="class-filter" value={classFilter} onChange={event => setClassFilter(event.target.value)} className="min-h-11 rounded-lg border border-gray-300 bg-white px-3 text-gray-900">
                <option value="all">All Classes</option>
                {STUDENT_CLASSES.map(studentClass => <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {message && <p aria-live="polite" className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>}
            <button type="button" onClick={handleSave} disabled={isSaving || isMonthPending || !hasChanges} className="min-h-11 rounded-lg bg-banner-dark px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0b5226] disabled:cursor-not-allowed disabled:opacity-50">
              {isSaving ? 'Saving…' : 'Save Monthly Payments'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto overscroll-x-contain">
          <table className="min-w-[1180px] w-full border-collapse text-left">
            <thead className="bg-gray-50">
              <tr className="border-b border-gray-200">
                {['Student', 'Student ID', 'Class', 'Address', 'Monthly Fees (MMK)', 'Remark', 'Status'].map(label => (
                  <th key={label} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-600 first:sticky first:left-0 first:z-20 first:bg-gray-50">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleStudents.map(student => {
                const tuition = tuitionState[student.id]
                if (!tuition) return null
                const rowTone = tuition.status === 'paid' ? 'bg-green-50/40' : tuition.status === 'scholar' ? 'bg-blue-50/40' : 'bg-white'
                return (
                  <tr key={student.id} className={`${rowTone} hover:bg-gray-50`}>
                    <td className={`sticky left-0 z-10 min-w-52 px-4 py-3 ${rowTone}`}>
                      <p className="font-bold text-gray-900">{student.full_name || 'No Name'}</p>
                      <p className="mt-1 text-xs text-gray-500">{student.email}</p>
                    </td>
                    <td className="min-w-44 px-4 py-3 text-sm font-semibold text-gray-700">{student.student_number || 'Pending assignment'}</td>
                    <td className="min-w-32 px-4 py-3 text-sm font-semibold text-banner-dark">{getStudentClassLabel(student.assigned_class)}</td>
                    <td className="min-w-60 max-w-72 px-4 py-3 text-sm leading-5 text-gray-600">{student.address || 'No address'}</td>
                    <td className="min-w-44 px-4 py-3">
                      <input aria-label={`Monthly fee for ${student.full_name || student.email}`} type="number" min="0" max="100000000" step="1000" value={tuition.amount || ''} onChange={event => updateTuition(student.id, 'amount', event.target.value)} placeholder="0" className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-right font-semibold text-gray-900 focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30" />
                    </td>
                    <td className="min-w-64 px-4 py-3">
                      <input aria-label={`Remark for ${student.full_name || student.email}`} type="text" maxLength={500} value={tuition.remarks || ''} onChange={event => updateTuition(student.id, 'remarks', event.target.value)} placeholder="Payment reference or note" className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30" />
                    </td>
                    <td className="min-w-36 px-4 py-3">
                      <select aria-label={`Payment status for ${student.full_name || student.email}`} value={tuition.status} onChange={event => updateTuition(student.id, 'status', event.target.value)} className={`min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30 ${tuition.status === 'paid' ? 'text-green-700' : tuition.status === 'scholar' ? 'text-blue-700' : 'text-red-700'}`}>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                        <option value="scholar">Scholar</option>
                      </select>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500">On mobile, swipe the table horizontally to edit every column.</p>
      </section>
    </div>
  )
}
