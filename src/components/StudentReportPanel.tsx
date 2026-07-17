import Link from 'next/link'
import {
  formatReportPeriod,
  formatReportRelease,
  getCurrentReportMonth,
  getPreviousMonth,
  getRecentWeeklyPeriods,
  getWeekOfMonth,
  isReportReleased,
} from '@/lib/studentReportPeriods'

type Props = {
  studentId: string
  canPreview?: boolean
}

function DownloadLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex min-h-11 items-center justify-center rounded-lg bg-banner-dark px-4 py-2 text-sm font-black text-white hover:bg-[#0b5226]"
    >
      {label}
    </Link>
  )
}

export default function StudentReportPanel({ studentId, canPreview = false }: Props) {
  const weeks = getRecentWeeklyPeriods(5)
  const currentMonth = getCurrentReportMonth()
  const months = [currentMonth, getPreviousMonth(currentMonth)]

  return (
    <section className="mb-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="student-reports-title">
      <div className="mb-5">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-banner-dark">Reports</p>
        <h2 id="student-reports-title" className="mt-1 text-xl font-black text-gray-950">Weekly &amp; Monthly Reports</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">
          Weekly reports open on the following Monday. Monthly summaries open on the first day of the next month.
        </p>
      </div>

      <details open className="group rounded-xl border border-gray-200">
        <summary className="cursor-pointer list-none px-4 py-3 font-black text-gray-900 marker:hidden">
          <span className="flex items-center justify-between gap-3">
            Weekly reports
            <span aria-hidden="true" className="text-banner-dark transition-transform group-open:rotate-180">⌄</span>
          </span>
        </summary>
        <div className="overflow-x-auto border-t border-gray-200">
          <table className="min-w-[660px] w-full text-left text-sm">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
              <tr><th className="px-4 py-3">Week</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3 text-right">PDF</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {weeks.map((week) => {
                const available = canPreview || isReportReleased('weekly', week)
                return (
                  <tr key={week}>
                    <td className="px-4 py-3 font-bold text-gray-900">Week {getWeekOfMonth(week)} · {formatReportPeriod('weekly', week)}</td>
                    <td className="px-4 py-3 text-gray-600">{available ? (canPreview && !isReportReleased('weekly', week) ? 'Admin preview' : 'Available') : `Opens ${formatReportRelease('weekly', week)}`}</td>
                    <td className="px-4 py-3 text-right">
                      {available ? <DownloadLink href={`/api/student-report?studentId=${encodeURIComponent(studentId)}&type=weekly&week=${week}`} label={canPreview && !isReportReleased('weekly', week) ? 'Preview' : 'Download'} /> : <span className="inline-flex min-h-11 items-center rounded-lg bg-gray-100 px-4 text-sm font-bold text-gray-500">Locked</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {months.map(month => {
          const available = canPreview || isReportReleased('monthly', month)
          return (
            <article key={month} className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
              <p className="text-xs font-black uppercase tracking-wider text-indigo-700">Monthly summary</p>
              <h3 className="mt-1 text-lg font-black text-gray-950">{formatReportPeriod('monthly', month)}</h3>
              <p className="mt-1 min-h-10 text-sm text-gray-600">{available ? (canPreview && !isReportReleased('monthly', month) ? 'Admin preview is ready.' : 'Report is available.') : `Opens ${formatReportRelease('monthly', month)}`}</p>
              <div className="mt-3">
                {available ? <DownloadLink href={`/api/student-report?studentId=${encodeURIComponent(studentId)}&type=monthly&month=${month}`} label={canPreview && !isReportReleased('monthly', month) ? 'Preview PDF' : 'Download PDF'} /> : <span className="inline-flex min-h-11 items-center rounded-lg bg-white px-4 text-sm font-bold text-gray-500">Locked</span>}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
