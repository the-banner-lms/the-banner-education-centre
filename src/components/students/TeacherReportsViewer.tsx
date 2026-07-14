'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Report = {
  id: string
  date: string
  created_at: string
  teacher: {
    id: string
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

type Attendance = {
  id: string
  student_id: string
  morning_status: string
  afternoon_status: string
  remarks: string
  student: {
    full_name: string | null
  } | null
  staff_id: string // This is the teacher's ID who submitted it
}

type Props = {
  currentDate: string
  reports: Report[]
  attendanceRecords: Attendance[]
}

export default function TeacherReportsViewer({ currentDate, reports, attendanceRecords }: Props) {
  const router = useRouter()
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null)

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    router.push(`?date=${e.target.value}`)
  }

  const selectedTeacherAttendance = selectedTeacherId 
    ? attendanceRecords.filter(a => a.staff_id === selectedTeacherId)
    : []

  return (
    <div className="space-y-6">
      {/* Date Selector */}
      <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
        <div className="flex items-center gap-4">
          <label className="block text-sm font-medium text-gray-700">View Reports for Date:</label>
          <input 
            type="date" 
            value={currentDate} 
            onChange={handleDateChange}
            className="block rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reports List */}
        <div className="bg-white shadow rounded-lg border border-gray-200 lg:col-span-1">
          <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Submitted Reports</h3>
          </div>
          <ul className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {reports.length === 0 ? (
              <li className="p-4 text-center text-gray-500 text-sm">No reports submitted for this date.</li>
            ) : (
              reports.map((report) => (
                <li 
                  key={report.id} 
                  className={`p-4 hover:bg-indigo-50 cursor-pointer transition-colors ${selectedTeacherId === report.teacher?.id ? 'bg-indigo-50 border-l-4 border-indigo-500' : ''}`}
                  onClick={() => setSelectedTeacherId(report.teacher?.id || null)}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <img className="h-10 w-10 rounded-full" src={report.teacher?.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(report.teacher?.email || '')} alt="" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {report.teacher?.full_name || report.teacher?.email}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        Submitted at: {new Date(report.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Attendance Details Viewer */}
        <div className="bg-white shadow rounded-lg border border-gray-200 lg:col-span-2">
          <div className="px-4 py-5 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Attendance Details {selectedTeacherId && `- Viewing specific report`}
            </h3>
          </div>
          
          {!selectedTeacherId ? (
            <div className="p-8 text-center text-gray-500">
              Select a teacher&apos;s report from the left to view the attendance they submitted.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Morning</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Afternoon</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedTeacherAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-gray-500 text-sm">No attendance records found for this submission.</td>
                    </tr>
                  ) : (
                    selectedTeacherAttendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {record.student?.full_name || 'Unknown Student'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.morning_status === 'present' ? 'bg-green-100 text-green-800' : record.morning_status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {record.morning_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.afternoon_status === 'present' ? 'bg-green-100 text-green-800' : record.afternoon_status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {record.afternoon_status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {record.remarks || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
