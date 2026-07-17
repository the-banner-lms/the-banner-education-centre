import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { canViewDashboard } from '@/utils/supabase/queries'
import RecentAnnouncementsInbox from '@/components/announcements/RecentAnnouncementsInbox'
import StudentReportDownloadButton from '@/components/StudentReportDownloadButton'
import TuitionInvoiceDownloadLink from '@/components/TuitionInvoiceDownloadLink'
import TuitionAmountBreakdown from '@/components/TuitionAmountBreakdown'
import WeeklyAttendanceTracker, { AttendanceStatus } from '@/components/WeeklyAttendanceTracker'
import WeeklyPerformanceDisplay from '@/components/WeeklyPerformanceDisplay'
import Link from 'next/link'
import { getRoleBannerGradient, getRoleBadgeStyle } from '@/utils/theme'
import { getTuitionDisplayStatus, getTuitionStatusStyle } from '@/lib/tuition'
import { getStudentClassLabel, getYleSubclassLabel } from '@/lib/studentClasses'

export const dynamic = 'force-dynamic'

export default async function UniversalUserDashboardView(props: {
  params: Promise<{ id: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams
  const { id: studentId } = await props.params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    redirect('/login')
  }

  const { data: currentUserProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!currentUserProfile) {
    return <div className="p-8 text-center text-red-500">Unauthorized.</div>
  }

  // Fetch target profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .single()

  if (!profile) {
    return <div className="p-8 text-center text-red-500">User not found.</div>
  }

  // Enforce hierarchical access control
  const isAuthorized = user.id === studentId || canViewDashboard(currentUserProfile.role, profile.role);
  if (!isAuthorized) {
    return <div className="p-8 text-center text-red-500 font-bold">Unauthorized. You do not have permission to view this dashboard.</div>
  }

  const isStudent = profile.role === 'student';
  const { data: performances } = await supabase
    .from('weekly_performances')
    .select('*')
    .eq('student_id', studentId)
    .order('week_start_date', { ascending: false })

  const { data: tuitionFees } = await supabase
    .from('monthly_tuition_fees')
    .select('*')
    .eq('student_id', studentId)
    .order('month_year', { ascending: false })

  const getStartOfCurrentWeek = () => {
    const d = new Date();
    // Adjust to Myanmar time (UTC + 6:30)
    d.setMinutes(d.getMinutes() + 390);
    const day = d.getUTCDay();
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);
    d.setUTCDate(diff);
    
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const date = String(d.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  const weekParam = typeof searchParams.week === 'string' ? searchParams.week : null;
  const weekStartDateStr = weekParam || getStartOfCurrentWeek();
  const [y, m, d] = weekStartDateStr.split('-').map(Number);
  
  const nextWeek = new Date(y, m - 1, d + 7);
  const prevWeek = new Date(y, m - 1, d - 7);
  const endDate = new Date(y, m - 1, d + 6); // Sunday

  const nextWeekStr = `${nextWeek.getFullYear()}-${String(nextWeek.getMonth() + 1).padStart(2, '0')}-${String(nextWeek.getDate()).padStart(2, '0')}`;
  const prevWeekStr = `${prevWeek.getFullYear()}-${String(prevWeek.getMonth() + 1).padStart(2, '0')}-${String(prevWeek.getDate()).padStart(2, '0')}`;
  const weekEndDateFullStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;

  const { data: attendanceData } = await supabase
    .from('daily_attendance')
    .select('date, morning_status, afternoon_status')
    .eq('student_id', studentId)
    .gte('date', weekStartDateStr)
    .lte('date', weekEndDateFullStr);

  const attendanceRecords = (attendanceData || []).map(r => ({
    date: r.date,
    morning_status: r.morning_status as AttendanceStatus | null,
    afternoon_status: r.afternoon_status as AttendanceStatus | null
  }));

  const { getRecentAnnouncementsForRole } = await import('@/utils/supabase/announcements');
  // Fetch announcements for the target user's role so admins/teachers see what the user actually sees
  const recentAnnouncements = await getRecentAnnouncementsForRole(supabase, profile.role, 5);

  const currentPerformances = performances?.filter(p => {
    return p.week_start_date >= weekStartDateStr && p.week_start_date <= weekEndDateFullStr;
  }) || [];

  const getBasePath = (role: string) => {
    switch(role) {
      case 'admin': return '/admin/students';
      case 'staff': return '/staff/students';
      case 'teacher': return '/teacher/students';
      default: return null;
    }
  };
  const basePath = getBasePath(currentUserProfile.role);

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="dashboard-content">
      {basePath && isStudent && user.id !== studentId && (
        <div className="mb-4 hide-in-pdf flex items-center justify-between">
          <Link href={basePath} className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">
            &larr; Back to Directory
          </Link>
          <Link href={`${basePath}/${studentId}`} className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-medium shadow-sm">
            Edit Performance Data
          </Link>
        </div>
      )}

      <div className="mb-8">
        <RecentAnnouncementsInbox announcements={recentAnnouncements || []} viewAllHref="/announcements" />
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200 mb-8 relative">
        <div className={`h-32 w-full ${getRoleBannerGradient(profile.role)}`}></div>
        
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 mb-4 gap-4">
            <div className="relative group">
              <img 
                src={profile.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.email || 'S')} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
                crossOrigin="anonymous"
              />
            </div>
            
            <div className="hide-in-pdf self-start sm:self-end mt-4 sm:mt-0">
              <StudentReportDownloadButton studentId={studentId} weekStartDate={weekStartDateStr} />
            </div>
          </div>
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name || 'No Name'}</h1>
            <p className="text-gray-600 font-medium">{profile.role === 'student' ? 'Student at The Banner Education Centre' : 'Staff Member'}</p>
            <p className="text-sm text-gray-500 mt-1">{profile.email}</p>
            {isStudent && (
              <div className="mt-1 space-y-1 text-sm font-semibold text-gray-700">
                <p>Student ID: {profile.student_number || 'Pending assignment'}</p>
                <p>Class: {getStudentClassLabel(profile.assigned_class)}</p>
                {profile.assigned_subclass && <p className="text-blue-700">YLE: {getYleSubclassLabel(profile.assigned_subclass)}</p>}
              </div>
            )}
            <p className={`inline-block mt-3 text-xs px-2 py-1 rounded-full font-semibold uppercase tracking-wide ${getRoleBadgeStyle(profile.role)}`}>
              {profile.role}
            </p>
          </div>
        </div>
      </div>

      {isStudent && (
        <>
          <WeeklyPerformanceDisplay 
            performances={currentPerformances}
            weekStartDate={weekStartDateStr}
            prevWeekUrl={`/dashboard/${studentId}?week=${prevWeekStr}`}
            nextWeekUrl={`/dashboard/${studentId}?week=${nextWeekStr}`}
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
                      <TuitionAmountBreakdown total={fee.amount} baseAmount={fee.base_amount} yleAmount={fee.yle_amount} assignedClass={profile.assigned_class} yleSubclass={profile.assigned_subclass} />
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
        </>
      )}

      {isStudent && (
        <div className="mt-8">
          <WeeklyAttendanceTracker 
            weekStartDate={weekStartDateStr}
            attendanceRecords={attendanceRecords}
            prevWeekUrl={`/dashboard/${studentId}?week=${prevWeekStr}`}
            nextWeekUrl={`/dashboard/${studentId}?week=${nextWeekStr}`}
          />
        </div>
      )}
      
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
