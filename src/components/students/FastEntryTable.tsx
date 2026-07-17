'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { bulkSaveMonthlyTuition, type TuitionEntry } from '@/app/actions/fastEntryActions'
import { getYleSubclassLabel, STUDENT_CLASSES } from '@/lib/studentClasses'

type Student = {
  id: string
  full_name: string | null
  email: string
  student_number: string | null
  assigned_class: string | null
  assigned_subclass: string | null
  address: string | null
  approval_status: 'pending' | 'approved' | 'rejected' | null
}

type ExistingTuition = {
  student_id: string
  month_year: string
  status: 'paid' | 'unpaid' | 'scholar'
  amount: number | string | null
  base_amount: number | string | null
  yle_amount: number | string | null
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
      const existingTotal = Number(existing?.amount || 0)
      const storedBaseAmount = Number(existing?.base_amount || 0)
      const storedYleAmount = Number(existing?.yle_amount || 0)
      const splitMatchesTotal = Math.abs((storedBaseAmount + storedYleAmount) - existingTotal) < 0.01
      const baseAmount = splitMatchesTotal
        ? storedBaseAmount
        : student.assigned_class === 'yle' ? 0 : existingTotal
      const yleAmount = splitMatchesTotal
        ? storedYleAmount
        : student.assigned_class === 'yle' ? existingTotal : 0
      nextState[student.id] = {
        student_id: student.id,
        status: existing?.status || 'unpaid',
        amount: baseAmount + yleAmount,
        base_amount: baseAmount,
        yle_amount: yleAmount,
        remarks: existing?.remarks || '',
        recorded: Boolean(existing),
      }
    })
    setTuitionState(nextState)
    setHasChanges(false)
    setMessage(null)
  }, [students, existingTuition, monthYear])

  const updateTuition = (studentId: string, field: 'status' | 'base_amount' | 'yle_amount' | 'remarks', value: string) => {
    setTuitionState(previous => {
      const current = previous[studentId]
      const next = {
        ...current,
        [field]: field === 'base_amount' || field === 'yle_amount' ? Number(value || 0) : value,
        recorded: true,
      } as TuitionEntry
      next.amount = Number(next.base_amount || 0) + Number(next.yle_amount || 0)
      return { ...previous, [studentId]: next }
    })
    setHasChanges(true)
    setMessage(null)
  }

  const classGroups = useMemo(() => STUDENT_CLASSES.map(studentClass => ({
    ...studentClass,
    students: students.filter(student => student.assigned_class === studentClass.value),
  })), [students])

  const summaries = useMemo(() => classGroups.map(studentClass => {
    const classStudents = studentClass.students
    const entries = classStudents
      .map(student => tuitionState[student.id])
      .filter((entry): entry is TuitionEntry => Boolean(entry))
    const recordedEntries = entries
      .filter(entry => entry.recorded || entry.amount > 0 || entry.status !== 'unpaid' || Boolean(entry.remarks))
    const baseTotal = entries.reduce((sum, entry) => sum + entry.base_amount, 0)
    const yleTotal = entries.reduce((sum, entry) => sum + entry.yle_amount, 0)
    const total = baseTotal + yleTotal
    const paid = entries.filter(entry => entry.status === 'paid')
    const unpaid = entries.filter(entry => entry.status === 'unpaid')
    const scholars = entries.filter(entry => entry.status === 'scholar')

    return {
      value: studentClass.value,
      label: studentClass.label,
      studentCount: classStudents.length,
      recordedCount: recordedEntries.length,
      baseTotal,
      yleTotal,
      total,
      collected: paid.reduce((sum, entry) => sum + entry.amount, 0),
      outstanding: unpaid.reduce((sum, entry) => sum + entry.amount, 0),
      waived: scholars.reduce((sum, entry) => sum + entry.amount, 0),
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      scholarCount: scholars.length,
    }
  }), [classGroups, tuitionState])

  const overall = useMemo(() => summaries.reduce((result, summary) => ({
    studentCount: result.studentCount + summary.studentCount,
    recordedCount: result.recordedCount + summary.recordedCount,
    baseTotal: result.baseTotal + summary.baseTotal,
    yleTotal: result.yleTotal + summary.yleTotal,
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
    baseTotal: 0,
    yleTotal: 0,
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
  const autoRemark = `${monthLabel}: ${overall.recordedCount} payment records. Base ${formatAmount(overall.baseTotal)}, YLE ${formatAmount(overall.yleTotal)}. Paid ${overall.paidCount} (${formatAmount(overall.collected)} collected), unpaid ${overall.unpaidCount} (${formatAmount(overall.outstanding)} outstanding), scholar ${overall.scholarCount} (${formatAmount(overall.waived)} waived). Collection rate ${collectionRate}%.`

  const classRemark = (summary: (typeof summaries)[number]) =>
    `${summary.recordedCount}/${summary.studentCount} recorded. Base ${formatAmount(summary.baseTotal)}, YLE ${formatAmount(summary.yleTotal)}. Paid ${summary.paidCount} (${formatAmount(summary.collected)} collected), unpaid ${summary.unpaidCount} (${formatAmount(summary.outstanding)} outstanding), scholar ${summary.scholarCount} (${formatAmount(summary.waived)} waived).`

  const visibleGroups = classFilter === 'all'
    ? classGroups
    : classGroups.filter(group => group.value === classFilter)

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
        const delivery = result.emailDelivery
        const emailNote = delivery?.sent
          ? ` ${delivery.sent} paid invoice email${delivery.sent === 1 ? '' : 's'} sent.`
          : delivery?.notConfigured
            ? ' Paid records saved; email provider setup is still required.'
            : delivery?.failed
              ? ' Paid records saved; one or more emails need retrying.'
              : ''
        setMessage({ type: 'success', text: `${result.savedCount || 0} monthly payment records saved. Student dashboards are synced.${emailNote}` })
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
      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 bg-gray-50 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <div className="w-full sm:w-auto">
              <label htmlFor="tuition-month" className="mb-1 block text-sm font-bold text-gray-700">Tuition Month</label>
              <input id="tuition-month" type="month" value={monthYear} onChange={event => handleMonthChange(event.target.value)} disabled={isMonthPending || hasChanges} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto" />
              {hasChanges && <p className="mt-1 text-xs text-amber-700">Save changes before switching month.</p>}
            </div>
            <div className="w-full sm:w-auto">
              <label htmlFor="class-filter" className="mb-1 block text-sm font-bold text-gray-700">Class Filter</label>
              <select id="class-filter" value={classFilter} onChange={event => setClassFilter(event.target.value)} className="min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-gray-900 sm:w-auto">
                <option value="all">All Classes</option>
                {STUDENT_CLASSES.map(studentClass => <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>)}
              </select>
            </div>
          </div>
          <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            {message && <p aria-live="polite" className={`text-sm font-semibold ${message.type === 'success' ? 'text-green-700' : 'text-red-700'}`}>{message.text}</p>}
            <button type="button" onClick={handleSave} disabled={isSaving || isMonthPending || !hasChanges} className="min-h-11 w-full rounded-lg bg-banner-dark px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-[#0b5226] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto">
              {isSaving ? 'Saving…' : 'Save Monthly Payments'}
            </button>
          </div>
        </div>
      </section>

      <div className="space-y-5">
        {visibleGroups.map(group => {
          const summary = summaries.find(item => item.value === group.value)!
          const showsYleDual = group.value !== 'pre-kg'
          return (
            <section key={group.value} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              <div className="flex flex-col gap-1 border-b border-gray-200 bg-gray-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-lg font-black text-gray-900">{group.label}</h2>
                <p className="text-sm font-semibold text-gray-600">{summary.studentCount} students · {summary.recordedCount} recorded</p>
              </div>
              <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]" tabIndex={0} aria-label={`${group.label} monthly tuition table`}>
                <table className={`w-full border-collapse text-left ${showsYleDual ? 'min-w-[980px]' : 'min-w-[700px]'}`}>
                  <thead className="bg-white">
                    <tr className="border-b border-gray-200">
                      {['Name + Student ID', ...(showsYleDual ? ['YLE Status'] : []), 'Payment Status', 'Base Fee (MMK)', ...(showsYleDual ? ['YLE Fee (MMK)'] : []), 'Total (MMK)'].map(label => (
                        <th key={label} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-600 first:sticky first:left-0 first:z-20 first:bg-white">{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {group.students.length === 0 ? (
                      <tr><td colSpan={showsYleDual ? 6 : 4} className="px-4 py-7 text-center text-sm text-gray-500">No students assigned to this class.</td></tr>
                    ) : group.students.map(student => {
                      const tuition = tuitionState[student.id]
                      if (!tuition) return null
                      const hasYle = Boolean(student.assigned_subclass)
                      const isYleStandalone = student.assigned_class === 'yle'
                      const rowTone = tuition.status === 'paid' ? 'bg-green-50/40' : tuition.status === 'scholar' ? 'bg-blue-50/40' : 'bg-white'
                      return (
                        <tr key={student.id} className={`${rowTone} hover:bg-gray-50`}>
                          <td className={`sticky left-0 z-10 min-w-52 px-4 py-3 sm:min-w-64 ${rowTone}`}>
                            <p className="font-bold text-gray-900">{student.full_name || 'No Name'}</p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <p className="text-xs font-semibold text-gray-500">{student.student_number || 'Pending ID'}</p>
                              {student.approval_status !== 'approved' && (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${student.approval_status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}`}>
                                  {student.approval_status || 'pending'}
                                </span>
                              )}
                            </div>
                          </td>
                          {showsYleDual && (
                            <td className="min-w-40 px-4 py-3 text-sm font-semibold">
                              {hasYle ? (
                                <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-800">
                                  {isYleStandalone ? 'Standalone' : 'Dual'} · {getYleSubclassLabel(student.assigned_subclass)}
                                </span>
                              ) : (
                                <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold text-gray-600">Not assigned</span>
                              )}
                            </td>
                          )}
                          <td className="min-w-48 px-4 py-3">
                            <select aria-label={`Payment status for ${student.full_name || student.email}`} value={tuition.status} onChange={event => updateTuition(student.id, 'status', event.target.value)} className={`min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm font-bold focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30 ${tuition.status === 'paid' ? 'text-green-700' : tuition.status === 'scholar' ? 'text-blue-700' : 'text-red-700'}`}>
                              <option value="paid">Paid</option>
                              <option value="unpaid">Unpaid</option>
                              <option value="scholar">Scholar</option>
                            </select>
                          </td>
                          <td className="min-w-48 px-4 py-3">
                            <input aria-label={`Base class fee for ${student.full_name || student.email}`} type="number" inputMode="numeric" min="0" max="100000000" step="1000" value={tuition.base_amount || ''} onChange={event => updateTuition(student.id, 'base_amount', event.target.value)} disabled={isYleStandalone} placeholder="0" className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-right font-semibold text-gray-900 focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500" />
                          </td>
                          {showsYleDual && (
                            <td className="min-w-48 px-4 py-3">
                              <input aria-label={`YLE fee for ${student.full_name || student.email}`} type="number" inputMode="numeric" min="0" max="100000000" step="1000" value={tuition.yle_amount || ''} onChange={event => updateTuition(student.id, 'yle_amount', event.target.value)} disabled={!hasYle} placeholder={hasYle ? '0' : 'Not assigned'} className="min-h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-right font-semibold text-blue-800 focus:border-banner-dark focus:outline-none focus:ring-2 focus:ring-banner-light/30 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500" />
                            </td>
                          )}
                          <td className="min-w-40 px-4 py-3 text-right text-sm font-black text-banner-dark">{formatAmount(tuition.amount)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot className="border-t-2 border-banner-dark bg-green-50">
                    <tr>
                      <th className="sticky left-0 z-10 bg-green-50 px-4 py-3 text-sm font-black text-gray-900">{group.label} Total · {summary.studentCount} students</th>
                      {showsYleDual && <td className="px-4 py-3 text-sm font-semibold text-gray-600">YLE assignment status</td>}
                      <td className="px-4 py-3 text-xs font-semibold text-gray-700">Paid {summary.paidCount} · Unpaid {summary.unpaidCount} · Scholar {summary.scholarCount}</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-gray-900">{formatAmount(summary.baseTotal)}</td>
                      {showsYleDual && <td className="px-4 py-3 text-right text-sm font-black text-blue-800">{formatAmount(summary.yleTotal)}</td>}
                      <td className="px-4 py-3 text-right text-base font-black text-banner-dark">{formatAmount(summary.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <p className="border-t border-gray-100 bg-gray-50 px-4 py-2 text-xs text-gray-500 sm:hidden">Swipe horizontally to edit every column.</p>
            </section>
          )
        })}
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-4">
          <h2 className="text-lg font-black text-gray-900">All Class Monthly Summary</h2>
          <p className="mt-1 text-sm text-gray-500">Live totals update as fee amounts and statuses change.</p>
        </div>
        <div className="overflow-x-auto overscroll-x-contain [scrollbar-width:thin]" tabIndex={0} aria-label="All class monthly tuition summary">
          <table className="w-full min-w-[860px] border-collapse text-left sm:min-w-[980px]">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                {['Month + Year', 'Class', 'Base Amount', 'YLE Amount', 'Total Amount', 'Remark (Auto-generated)'].map(label => (
                  <th key={label} className="px-4 py-3 text-xs font-black uppercase tracking-wide text-gray-600">{label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {summaries.map(summary => (
                <tr key={summary.value} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-gray-700">{monthLabel}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-black text-gray-900">{summary.label}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-gray-900">{formatAmount(summary.baseTotal)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-blue-800">{formatAmount(summary.yleTotal)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-black text-banner-dark">{formatAmount(summary.total)}</td>
                  <td className="min-w-[430px] px-4 py-3 text-sm leading-5 text-gray-600">{classRemark(summary)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-banner-dark bg-green-50">
              <tr>
                <th className="px-4 py-4 text-sm font-black text-gray-900">{monthLabel}</th>
                <th className="px-4 py-4 text-sm font-black text-gray-900">All Classes Total</th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-gray-900">{formatAmount(overall.baseTotal)}</th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-sm font-black text-blue-800">{formatAmount(overall.yleTotal)}</th>
                <th className="whitespace-nowrap px-4 py-4 text-right text-base font-black text-banner-dark">{formatAmount(overall.total)}</th>
                <td className="px-4 py-4 text-sm font-semibold leading-5 text-gray-700">{autoRemark}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-500"><span className="sm:hidden">Swipe horizontally to view every column. </span>Amount is the recorded fee total. The auto remark separates collected, outstanding and scholar-waived amounts.</p>
      </section>
    </div>
  )
}
