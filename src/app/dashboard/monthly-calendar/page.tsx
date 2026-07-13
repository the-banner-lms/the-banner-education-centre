import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PDFDownloadButton from '@/components/PDFDownloadButton'

export const dynamic = 'force-dynamic'

export default async function MonthlyCalendarPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) return <div className="p-8 text-center text-red-500">Profile not found.</div>

  const monthParam = typeof searchParams.month === 'string' ? searchParams.month : null;
  const today = new Date();
  const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
  
  const targetMonthStr = monthParam || currentMonthStr;
  const [year, month] = targetMonthStr.split('-').map(Number);

  // Calculate start and end of month
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0); // Last day of month

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const { data: attendanceData } = await supabase
    .from('daily_attendance')
    .select('date, morning_status, afternoon_status')
    .eq('student_id', user.id)
    .gte('date', startDateStr)
    .lte('date', endDateStr);

  const prevMonthDate = new Date(year, month - 2, 1);
  const nextMonthDate = new Date(year, month, 1);
  const prevMonthStr = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;
  const nextMonthStr = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`;

  // Generate calendar grid
  // Find what day the 1st is (0 = Sunday, 1 = Monday)
  // Let's adjust so Monday is index 0
  let startDay = startDate.getDay() - 1;
  if (startDay < 0) startDay = 6; // Sunday becomes index 6

  const daysInMonth = endDate.getDate();
  const gridDays = [];
  
  // padding start
  for(let i = 0; i < startDay; i++) {
    gridDays.push(null);
  }
  
  // actual days
  for(let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const record = attendanceData?.find(r => r.date === dateStr);
    gridDays.push({
      day: d,
      dateStr,
      morning_status: record?.morning_status || null,
      afternoon_status: record?.afternoon_status || null
    });
  }

  const getStatusDisplay = (status: string | null) => {
    switch(status) {
      case 'present': return <span className="inline-block px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded shadow-sm w-full text-center">✅ Present</span>;
      case 'absent': return <span className="inline-block px-1.5 py-0.5 bg-red-100 text-red-700 text-[10px] rounded shadow-sm w-full text-center">❌ Absent</span>;
      case 'leave': return <span className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] rounded shadow-sm w-full text-center">⚠️ Leave</span>;
      default: return null;
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-8" id="calendar-content">
      <div className="mb-4 hide-in-pdf flex items-center justify-between">
        <Link href="/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium bg-white px-4 py-2 rounded shadow-sm border border-gray-200">
          &larr; Back to Dashboard
        </Link>
        <PDFDownloadButton targetId="calendar-content" filename={`${profile.full_name || 'student'}-attendance-${targetMonthStr}.pdf`} />
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-4">
            <Link href={`/dashboard/monthly-calendar?month=${prevMonthStr}`} className="text-gray-500 hover:text-indigo-600 hide-in-pdf bg-gray-50 px-3 py-1 rounded-md border border-gray-200">&larr;</Link>
            <h2 className="text-2xl font-bold text-gray-900">
              {startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </h2>
            <Link href={`/dashboard/monthly-calendar?month=${nextMonthStr}`} className="text-gray-500 hover:text-indigo-600 hide-in-pdf bg-gray-50 px-3 py-1 rounded-md border border-gray-200">&rarr;</Link>
          </div>
          <div className="text-right">
            <h3 className="font-bold text-gray-800 text-lg">{profile.full_name}</h3>
            <p className="text-sm text-gray-500">Monthly Attendance Report</p>
          </div>
        </div>

        <div className="grid grid-cols-7 border-t border-l border-gray-200 rounded-lg overflow-hidden">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
            <div key={day} className="border-r border-b border-gray-200 p-3 text-center text-sm font-bold bg-gray-50 text-gray-700 uppercase tracking-wider">
              {day}
            </div>
          ))}
          
          {gridDays.map((cell, idx) => (
            <div key={idx} className={`border-r border-b border-gray-200 p-1 sm:p-2 min-h-[100px] sm:min-h-[120px] transition-colors ${!cell ? 'bg-gray-50' : 'bg-white hover:bg-gray-50'}`}>
              {cell && (
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-medium text-center mb-1 ${cell.morning_status || cell.afternoon_status ? 'text-gray-900 font-bold' : 'text-gray-500'}`}>{cell.day}</span>
                  <div className="flex flex-col space-y-1 mt-auto">
                    {cell.morning_status && (
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 font-bold w-4">AM</span>
                        {getStatusDisplay(cell.morning_status)}
                      </div>
                    )}
                    {cell.afternoon_status && (
                      <div className="flex items-center space-x-1">
                        <span className="text-[10px] text-gray-400 font-bold w-4">PM</span>
                        {getStatusDisplay(cell.afternoon_status)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-8 pt-4 border-t border-gray-100 flex items-center justify-center space-x-6 text-sm text-gray-600 hide-in-pdf">
          <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span><span>Present</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span><span>Absent</span></div>
          <div className="flex items-center space-x-2"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span><span>Leave</span></div>
        </div>

        <div className="mt-8 text-center text-gray-400 text-xs hidden-in-browser show-only-in-pdf">
          <p>Generated by The Banner Education Centre • {new Date().toLocaleDateString()}</p>
        </div>
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
