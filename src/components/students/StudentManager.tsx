import { uploadProfilePicture, saveWeeklyPerformance, markDailyAttendance, recordMonthlyTuitionFee, updateStudentDetails } from '@/app/actions/studentActions'
import ProfilePictureUpload from '@/app/admin/students/[id]/ProfilePictureUpload' // We'll move this later if needed, or leave it and update import
import Link from 'next/link'
import { getRoleBannerGradient } from '@/utils/theme'
import { DailyDatePicker, WeeklyDatePicker, MonthlyDatePicker } from '@/components/CustomDatePickers'
import WeeklyPerformanceDisplay from '@/components/WeeklyPerformanceDisplay'
import TuitionInvoiceDownloadLink from '@/components/TuitionInvoiceDownloadLink'
import { getStudentClassLabel, getYleSubclassLabel, STUDENT_CLASSES, YLE_SUBCLASSES } from '@/lib/studentClasses'
import { formatTuitionAmount, getTuitionDisplayStatus, getTuitionStatusStyle } from '@/lib/tuition'

export default function StudentManager({
  student,
  studentId,
  performances,
  tuitionFees,
  attendanceHistory,
  weekStartDateStr,
  prevWeekStr,
  nextWeekStr,
  weekEndDateFullStr,
  basePath,
  showTuition = false,
  canManageClass = false,
}: {
  student: any;
  studentId: string;
  performances: any[];
  tuitionFees: any[];
  attendanceHistory: any[];
  weekStartDateStr: string;
  prevWeekStr: string;
  nextWeekStr: string;
  weekEndDateFullStr: string;
  basePath: string;
  showTuition?: boolean;
  canManageClass?: boolean;
}) {
  const gradeOptions = ['Excellent', 'Good', 'Needs Improvement']

  const currentPerformances = performances?.filter(p => {
    return p.week_start_date >= weekStartDateStr && p.week_start_date <= weekEndDateFullStr;
  }) || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center space-x-4 mb-6">
        <Link href={basePath} className="text-sm text-indigo-600 hover:text-indigo-900">
          &larr; Back to Directory
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        <div className={`h-32 w-full ${getRoleBannerGradient(student.role)}`}></div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end -mt-16 mb-4 gap-4">
            <div className="relative group flex flex-col items-center">
              <img 
                src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)} 
                alt="Profile" 
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
              <div className="mt-3">
                <ProfilePictureUpload studentId={studentId} uploadAction={uploadProfilePicture} />
              </div>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.full_name || 'No Name Provided'}</h1>
            <p className="text-gray-600 font-medium">Student at The Banner Education Centre</p>
            <p className="mt-2 inline-flex rounded-full bg-green-50 px-3 py-1 text-sm font-semibold text-[#0f6630] ring-1 ring-inset ring-green-200">
              Class: {getStudentClassLabel(student.assigned_class)}
            </p>
            {student.assigned_class === 'yle' && (
              <p className="ml-2 mt-2 inline-flex rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700 ring-1 ring-inset ring-blue-200">
                {getYleSubclassLabel(student.assigned_subclass)}
              </p>
            )}
            <p className="text-sm text-gray-500 mt-1">{student.email}</p>
            <p className="mt-2 text-sm text-gray-600">Address: {student.address || 'No address'}</p>
            <p className="mt-2 text-sm font-semibold text-gray-700">
              Student ID: {student.student_number || 'Pending assignment'}
            </p>

            {canManageClass && (
              <form action={updateStudentDetails.bind(null, studentId)} className="mt-5 grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 sm:grid-cols-2 sm:items-end">
                <div className="min-w-0 flex-1">
                  <label htmlFor="assigned_class" className="block text-sm font-semibold text-gray-800">Change Assigned Class</label>
                  <select
                    id="assigned_class"
                    name="assigned_class"
                    required
                    defaultValue={student.assigned_class || ''}
                    className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20"
                  >
                    <option value="" disabled>Select a class</option>
                    {STUDENT_CLASSES.map((studentClass) => (
                      <option key={studentClass.value} value={studentClass.value}>{studentClass.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="assigned_subclass" className="block text-sm font-semibold text-gray-800">YLE Sub-class</label>
                  <select
                    id="assigned_subclass"
                    name="assigned_subclass"
                    defaultValue={student.assigned_subclass || ''}
                    className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20"
                  >
                    <option value="">Not applicable / select for YLE</option>
                    {YLE_SUBCLASSES.map((subclass) => (
                      <option key={subclass.value} value={subclass.value}>{subclass.label}</option>
                    ))}
                  </select>
                </div>
                <div className="min-w-0">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-800">Address</label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    minLength={3}
                    maxLength={300}
                    defaultValue={student.address || ''}
                    autoComplete="street-address"
                    placeholder="Enter student address"
                    className="mt-2 min-h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-[#0f6630] focus:outline-none focus:ring-2 focus:ring-[#0f6630]/20"
                  />
                </div>
                <button type="submit" className="min-h-11 rounded-lg bg-[#0f6630] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0b5226] sm:col-span-2 sm:justify-self-end">
                  Save Assignment & Address
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Record Daily Attendance (နေ့စဉ် မှတ်တမ်း တင်ရန်)</h2>
        </div>
        <div className="p-6">
          <form action={async (formData) => {
            'use server'
            const data = {
              student_id: studentId,
              date: formData.get('date') as string,
              morning_status: formData.get('morning_status') as string,
              afternoon_status: formData.get('afternoon_status') as string,
              remarks: formData.get('remarks') as string,
            }
            await markDailyAttendance(data)
          }} className="space-y-4">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <DailyDatePicker recordedDates={attendanceHistory ? attendanceHistory.map(r => r.date) : []} />
                </div>
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 h-min">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Morning Session</label>
                  <select name="morning_status" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                    <option value="present">Present (✅)</option>
                    <option value="absent">Absent (❌)</option>
                    <option value="leave">Leave (⚠️)</option>
                    <option value="off">Off Day (⏸️)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Afternoon Session</label>
                  <select name="afternoon_status" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border">
                    <option value="present">Present (✅)</option>
                    <option value="absent">Absent (❌)</option>
                    <option value="leave">Leave (⚠️)</option>
                    <option value="off">Off Day (⏸️)</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
              <input type="text" name="remarks" placeholder="Late, sick, etc." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
            </div>

            <div className="flex justify-end mt-4">
              <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
                Save Attendance
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Add Weekly Performance (အပတ်စဉ် မှတ်တမ်း တင်ရန်)</h2>
        </div>
        <div className="p-6">
        <form action={async (formData) => {
          'use server'
          const data = {
            student_id: studentId,
            week_start_date: formData.get('week_start_date') as string,
            burmese_score: formData.get('burmese_score') as string,
            english_score: formData.get('english_score') as string,
            math_score: formData.get('math_score') as string,
            science_score: formData.get('science_score') as string,
            sports_score: formData.get('sports_score') as string,
            art_score: formData.get('art_score') as string,
            social_score: formData.get('social_score') as string,
            health_score: formData.get('health_score') as string,
            teamwork_score: formData.get('teamwork_score') as string,
            discipline_score: formData.get('discipline_score') as string,
            remarks: formData.get('remarks') as string,
          }
          await saveWeeklyPerformance(data)
        }} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="w-full lg:w-auto flex justify-center lg:justify-start">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Week Start Date</label>
                <WeeklyDatePicker recordedWeeks={performances ? performances.map(r => r.week_start_date) : []} />
              </div>
            </div>
            
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 h-min">
              {['burmese', 'english', 'math', 'science', 'sports', 'art', 'social', 'health', 'teamwork', 'discipline'].map((category) => (
                <div key={category}>
                  <label className="block text-xs font-medium text-gray-700 capitalize">{category}</label>
                  <select name={`${category}_score`} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-1.5 border">
                    {gradeOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700">Staff/Teacher Remarks</label>
            <textarea required name="remarks" rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" placeholder="Enter performance remarks here..."></textarea>
          </div>

          <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 text-sm font-semibold mt-4">
            Save Performance
          </button>
        </form>
        </div>
      </div>

      {showTuition && (
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-bold text-gray-900">Record Monthly Tuition Fee (လစဉ် မှတ်တမ်း တင်ရန်)</h2>
          </div>
          <div className="p-6">
            <form action={async (formData) => {
              'use server'
              const data = {
                student_id: studentId,
                month_year: formData.get('month_year') as string,
                status: formData.get('status') as string,
                amount: Number(formData.get('amount') || 0),
                remarks: formData.get('remarks') as string,
              }
              await recordMonthlyTuitionFee(data)
            }} className="space-y-4">
              <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-auto flex justify-center lg:justify-start">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Month</label>
                    <MonthlyDatePicker recordedMonths={tuitionFees ? tuitionFees.map(r => r.month_year) : []} />
                  </div>
                </div>
                <div className="flex-1 h-min">
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700">Monthly Fee Amount (MMK)</label>
                    <input type="number" name="amount" required min="0" max="100000000" step="1000" placeholder="0" className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 md:w-1/2 lg:w-1/3" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select name="status" required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border md:w-1/2 lg:w-1/3">
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="scholar">Scholar</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Remarks (Optional)</label>
                <input type="text" name="remarks" placeholder="Payment reference, etc." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border" />
              </div>

              <div className="flex justify-end mt-4">
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700">
                  Save Tuition Fee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-bold mb-4 text-gray-900">Performance History</h2>
          <WeeklyPerformanceDisplay 
            performances={currentPerformances}
            weekStartDate={weekStartDateStr}
            prevWeekUrl={`${basePath}/${studentId}?week=${prevWeekStr}`}
            nextWeekUrl={`${basePath}/${studentId}?week=${nextWeekStr}`}
          />
      </div>

      {showTuition && (
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
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
                    <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice / Email</th>
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
                      <td className="px-4 py-3 text-sm font-semibold text-gray-800 whitespace-nowrap">{formatTuitionAmount(fee.amount)}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{fee.remarks}</td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        <p className="mb-1 whitespace-nowrap font-mono text-xs font-semibold text-gray-700">{fee.invoice_number || 'Preparing invoice'}</p>
                        {fee.status === 'paid' && <p className="mb-2 whitespace-nowrap text-xs font-semibold">Email: {fee.email_status === 'sent' ? 'Sent' : fee.email_status === 'not_configured' ? 'Setup required' : fee.email_status === 'failed' ? 'Failed' : 'Pending'}</p>}
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
      )}
    </div>
  )
}
