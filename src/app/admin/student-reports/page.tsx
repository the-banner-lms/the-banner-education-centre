import { createClient } from '@/utils/supabase/server'
import { getStudentClassLabel, STUDENT_CLASSES } from '@/lib/studentClasses'
import {
  formatReportPeriod,
  getCurrentMyanmarWeek,
  getCurrentReportMonth,
  monthBounds,
} from '@/lib/studentReportPeriods'
import { resendReportEmail } from './actions'

export const dynamic = 'force-dynamic'

export default async function StudentReportsAdminPage(props: {
  searchParams: Promise<{ class?: string; week?: string; month?: string }>
}) {
  const searchParams = await props.searchParams
  const supabase = await createClient()
  const week = /^\d{4}-\d{2}-\d{2}$/.test(searchParams.week || '') ? searchParams.week! : getCurrentMyanmarWeek()
  const month = /^\d{4}-\d{2}$/.test(searchParams.month || '') ? searchParams.month! : getCurrentReportMonth()
  const classFilter = searchParams.class || 'all'

  let studentsQuery = supabase
    .from('profiles')
    .select('id, full_name, email, student_number, assigned_class')
    .eq('role', 'student')
    .order('assigned_class')
    .order('full_name')
  if (classFilter !== 'all') studentsQuery = studentsQuery.eq('assigned_class', classFilter)

  const [{ data: students }, { data: deliveries }] = await Promise.all([
    studentsQuery,
    supabase
      .from('student_report_deliveries')
      .select('id, student_id, report_type, period_key, email_status, email_sent_at, email_error')
      .in('period_key', [week, month]),
  ])

  const deliveryByKey = new Map((deliveries || []).map(delivery => [`${delivery.student_id}:${delivery.report_type}:${delivery.period_key}`, delivery]))

  return (
    <main className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="text-xs font-black uppercase tracking-[0.18em] text-banner-dark">Data &amp; Reports</p>
        <h1 className="mt-1 text-3xl font-black text-gray-950">Student Reports</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600">Admin can preview every report before its student release date. Weekly email releases run on Monday; monthly releases run on the first day of the next month.</p>
      </div>

      <form className="mb-5 grid gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:grid-cols-4 sm:items-end">
        <label className="text-sm font-bold text-gray-800">Class
          <select name="class" defaultValue={classFilter} className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3">
            <option value="all">All classes</option>
            {STUDENT_CLASSES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
        <label className="text-sm font-bold text-gray-800">Weekly period
          <input name="week" type="date" defaultValue={week} className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3" />
        </label>
        <label className="text-sm font-bold text-gray-800">Monthly period
          <input name="month" type="month" defaultValue={month} className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3" />
        </label>
        <button className="min-h-11 rounded-lg bg-banner-dark px-4 py-2 text-sm font-black text-white">Apply filters</button>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
        <table className="min-w-[920px] w-full text-left text-sm">
          <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-600">
            <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Class</th><th className="px-4 py-3">Weekly</th><th className="px-4 py-3">Monthly</th><th className="px-4 py-3">Email delivery</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(students || []).map(student => {
              const weeklyDelivery = deliveryByKey.get(`${student.id}:weekly:${week}`)
              const monthlyDelivery = deliveryByKey.get(`${student.id}:monthly:${month}`)
              return (
                <tr key={student.id} className="align-top">
                  <td className="px-4 py-4"><p className="font-black text-gray-950">{student.full_name || 'No name'}</p><p className="mt-1 text-xs text-gray-500">{student.student_number || student.email}</p></td>
                  <td className="px-4 py-4 font-bold text-gray-700">{getStudentClassLabel(student.assigned_class)}</td>
                  <td className="px-4 py-4"><p className="mb-2 text-xs text-gray-500">{formatReportPeriod('weekly', week)}</p><a href={`/api/student-report?studentId=${student.id}&type=weekly&week=${week}`} className="font-black text-banner-dark hover:underline">Preview PDF</a></td>
                  <td className="px-4 py-4"><p className="mb-2 text-xs text-gray-500">{formatReportPeriod('monthly', month)}</p><a href={`/api/student-report?studentId=${student.id}&type=monthly&month=${month}`} className="font-black text-banner-dark hover:underline">Preview PDF</a></td>
                  <td className="px-4 py-4">
                    {[weeklyDelivery, monthlyDelivery].map((delivery, index) => delivery ? (
                      <div key={delivery.id} className={index ? 'mt-3 border-t border-gray-100 pt-3' : ''}>
                        <p className="text-xs font-black uppercase text-gray-700">{delivery.report_type}: {delivery.email_status}</p>
                        {delivery.email_sent_at && <p className="mt-1 text-xs text-green-700">Sent {new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Yangon' }).format(new Date(delivery.email_sent_at))}</p>}
                        {delivery.email_error && <p className="mt-1 max-w-64 text-xs text-red-700">{delivery.email_error}</p>}
                        <form action={resendReportEmail} className="mt-2"><input type="hidden" name="deliveryId" value={delivery.id} /><button className="min-h-9 rounded-lg border border-banner-dark px-3 text-xs font-black text-banner-dark">Send again</button></form>
                      </div>
                    ) : <p key={index} className={index ? 'mt-2 text-xs text-gray-500' : 'text-xs text-gray-500'}>{index ? 'Monthly' : 'Weekly'}: not released</p>)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!students?.length && <p className="p-8 text-center text-gray-500">No students found for this class.</p>}
      </div>
      <p className="mt-3 text-xs text-gray-500">Selected month runs from {monthBounds(month).start} to {monthBounds(month).end}.</p>
    </main>
  )
}
