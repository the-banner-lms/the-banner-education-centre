import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'
import StudentReportDownloadButton from '@/components/StudentReportDownloadButton'
import TuitionInvoiceDownloadLink from '@/components/TuitionInvoiceDownloadLink'
import TuitionAmountBreakdown from '@/components/TuitionAmountBreakdown'
import WeeklyAttendanceTracker, { AttendanceStatus } from '@/components/WeeklyAttendanceTracker'
import WeeklyPerformanceDisplay from '@/components/WeeklyPerformanceDisplay'
import { getRoleBadgeStyle } from '@/utils/theme'
import { getTuitionDisplayStatus, getTuitionStatusStyle } from '@/lib/tuition'
import { getEnrollmentReviewNotices } from '@/lib/enrollmentNotices'
import { getStudentClassLabel, getYleSubclassLabel } from '@/lib/studentClasses'

export const dynamic = 'force-dynamic'

export default async function StudentDashboardPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  // Fetch student profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return <div className="p-8 text-center text-red-500">Profile not found.</div>
  }

  // Ensure they have access to the student dashboard
  if (!['student', 'teacher', 'staff', 'admin'].includes(profile.role)) {
    return <div className="p-8 text-center text-red-500">Unauthorized. This dashboard is for students.</div>
  }

  const { data: performances } = await supabase
    .from('weekly_performances')
    .select('*')
    .eq('student_id', user.id)
    .order('week_start_date', { ascending: false })

  const { data: tuitionFees } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('student_id', user.id)
    .order('month_year', { ascending: false })

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, 'student', 5);
  const paymentReviewNotices = profile.role === 'student'
    ? await getEnrollmentReviewNotices(profile.email, profile.student_number, { limit: 5 })
    : []

  const getStartOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    return start.toISOString().split('T')[0];
  };

  const weekParam = typeof searchParams.week === 'string' ? searchParams.week : null;
  const weekStartDateStr = weekParam || getStartOfCurrentWeek();
  const weekStartDate = new Date(weekStartDateStr);

  const nextWeek = new Date(weekStartDate);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const prevWeek = new Date(weekStartDate);
  prevWeek.setDate(prevWeek.getDate() - 7);

  const nextWeekStr = nextWeek.toISOString().split('T')[0];
  const prevWeekStr = prevWeek.toISOString().split('T')[0];

  const endDate = new Date(weekStartDate);
  endDate.setDate(endDate.getDate() + 4); // Friday
  const weekEndDateStr = endDate.toISOString().split('T')[0];

  const { data: attendanceData } = await supabase
    .from('daily_attendance')
    .select('date, morning_status, afternoon_status')
    .eq('student_id', user.id)
    .gte('date', weekStartDateStr)
    .lte('date', weekEndDateStr);

  const attendanceRecords = (attendanceData || []).map(r => ({
    date: r.date,
    morning_status: r.morning_status as AttendanceStatus | null,
    afternoon_status: r.afternoon_status as AttendanceStatus | null
  }));

  const currentPerformances = performances?.filter(p => {
    return p.week_start_date >= weekStartDateStr && p.week_start_date <= weekEndDateStr;
  }) || [];

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">
      <div className="mb-8">
        <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />
      </div>

      {paymentReviewNotices.length > 0 && (
        <section className="mb-8 space-y-3" aria-labelledby="payment-review-notices-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="payment-review-notices-title" className="text-lg font-black text-gray-900">Payment Review Notices</h2>
            <Link href="/enrollment" className="text-sm font-bold text-banner-dark hover:underline">Check by reference</Link>
          </div>
          {paymentReviewNotices.map(notice => (
            <article key={notice.id} className={`rounded-xl border p-4 ${notice.status === 'rejected' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className={`text-sm font-black ${notice.status === 'rejected' ? 'text-red-800' : 'text-green-800'}`}>
                    {notice.status === 'rejected' ? 'Payment Slip Rejected' : 'Payment Slip Verified'}
                    {notice.payment_month ? ` · ${notice.payment_month}` : ''}
                  </p>
                  {notice.review_reason && <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-6 text-gray-800">{notice.review_reason}</p>}
                  <p className="mt-2 break-all text-xs text-gray-600">Reference: <span className="font-mono font-semibold">{notice.tracking_code}</span></p>
                </div>
                <time className="shrink-0 text-xs font-semibold text-gray-600" dateTime={notice.reviewed_at}>
                  {new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Asia/Yangon' }).format(new Date(notice.reviewed_at))}
                </time>
              </div>
              {notice.status === 'rejected' && <p className="mt-3 text-sm font-bold text-red-800">Please correct the issue and submit a new payment slip.</p>}
            </article>
          ))}
        </section>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0 bg-white p-6 rounded-lg shadow border border-gray-100">
        <div className="flex items-center space-x-6">
          <img 
            src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.email || 'S')} 
            alt="Profile" 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-indigo-50 shadow-md"
            referrerPolicy="no-referrer"
            crossOrigin="anonymous" // Important for html2canvas to not taint canvas
          />
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name || 'My Dashboard'}</h1>
            <p className="text-gray-500">{profile.email}</p>
            {profile.role === 'student' && (
              <div className="mt-1 space-y-1 text-sm font-semibold text-gray-700">
                <p>Student ID: {profile.student_number || 'Pending assignment'}</p>
                <p>Class: {getStudentClassLabel(profile.assigned_class)}</p>
                {profile.assigned_subclass && <p className="text-blue-700">YLE: {getYleSubclassLabel(profile.assigned_subclass)}</p>}
              </div>
            )}
            <p className={`inline-block mt-2 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(profile.role)}`}>
              {profile.role}
            </p>
          </div>
        </div>
        <div className="hide-in-pdf">
          <StudentReportDownloadButton studentId={user.id} weekStartDate={weekStartDateStr} />
        </div>
      </div>

      <WeeklyPerformanceDisplay 
        performances={currentPerformances}
        weekStartDate={weekStartDateStr}
        prevWeekUrl={`/dashboard?week=${prevWeekStr}`}
        nextWeekUrl={`/dashboard?week=${nextWeekStr}`}
      />
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Tuition Fees History</h2>
        {tuitionFees && tuitionFees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice / Due</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {tuitionFees.map(fee => {
                  const displayStatus = getTuitionDisplayStatus(fee.status, fee.due_date)
                  return <tr key={fee.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{fee.month_year}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getTuitionStatusStyle(displayStatus)}`}>
                        {displayStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-800">
                      <TuitionAmountBreakdown total={fee.amount} baseAmount={fee.base_amount} yleAmount={fee.yle_amount} yleSubclass={profile.assigned_subclass} />
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{fee.remarks}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <p className="mb-2 whitespace-nowrap font-mono text-xs font-semibold text-gray-700">{fee.invoice_number || 'Preparing invoice'}</p>
                      <p className="mb-2 whitespace-nowrap text-xs">Due {fee.due_date ? new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Asia/Yangon' }).format(new Date(`${fee.due_date}T00:00:00+06:30`)) : '-'}</p>
                      <TuitionInvoiceDownloadLink feeId={fee.id} invoiceNumber={fee.invoice_number} />
                    </td>
                  </tr>
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-gray-500">No tuition fee records found.</p>
        )}
      </div>
      
      <div className="mt-8">
        <WeeklyAttendanceTracker 
          weekStartDate={weekStartDateStr}
          attendanceRecords={attendanceRecords}
          prevWeekUrl={`/dashboard?week=${prevWeekStr}`}
          nextWeekUrl={`/dashboard?week=${nextWeekStr}`}
        />
        <div className="mt-4 flex justify-end">
          <Link href="/dashboard/monthly-calendar" className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-50 hide-in-pdf">
            View Monthly Calendar
          </Link>
        </div>
      </div>
      
      {/* Footer for PDF printout */}
      <div className="mt-8 text-center text-gray-400 text-xs hidden-in-browser show-only-in-pdf">
        <p>Generated by The Banner Education Centre • {new Date().toLocaleDateString()}</p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        .show-only-in-pdf { display: none; }
        @media print {
          .show-only-in-pdf { display: block; }
          .hide-in-pdf { display: none !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
    </div>
  )
}
