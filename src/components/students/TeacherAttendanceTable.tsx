'use client'

import { useState, useEffect } from 'react'
import { submitTeacherDailyReport, AttendanceEntry } from '@/app/actions/fastEntryActions'

type Student = {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
}

type Props = {
  students: Student[]
  initialDate: string
  existingAttendance: any[]
}

export default function TeacherAttendanceTable({ 
  students, 
  initialDate, 
  existingAttendance 
}: Props) {
  const [date, setDate] = useState(initialDate)
  const [isSaving, setIsSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const [attendanceState, setAttendanceState] = useState<Record<string, AttendanceEntry>>({})

  useEffect(() => {
    const newAttState: Record<string, AttendanceEntry> = {}

    students.forEach(s => {
      const existingA = existingAttendance.find(a => a.student_id === s.id && a.date === date)
      newAttState[s.id] = {
        student_id: s.id,
        morning_status: existingA?.morning_status || 'present',
        afternoon_status: existingA?.afternoon_status || 'present',
        remarks: existingA?.remarks || ''
      }
    })

    setAttendanceState(newAttState)
  }, [students, existingAttendance, date])

  const handleAttendanceChange = (studentId: string, field: keyof AttendanceEntry, value: string) => {
    setAttendanceState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value }
    }))
  }

  const handleSubmitReport = async () => {
    setIsSaving(true)
    setSuccessMsg('')
    
    const attData = Object.values(attendanceState)

    const res = await submitTeacherDailyReport(date, attData)
    
    setIsSaving(false)
    if (res.error) {
      alert(res.error)
    } else {
      setSuccessMsg('Daily report submitted successfully! Admins and Staff can now view your report.')
      setTimeout(() => setSuccessMsg(''), 5000)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
      <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-end justify-between">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Attendance Date</label>
          <input 
            type="date" 
            value={date} 
            onChange={e => setDate(e.target.value)}
            className="block w-full sm:w-64 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
        <div className="flex items-center gap-4">
          {successMsg && <span className="text-green-600 text-sm font-medium">{successMsg}</span>}
          <button
            onClick={handleSubmitReport}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSaving ? 'Submitting...' : 'Submit Daily Report'}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Student
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Morning
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Afternoon
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Daily Remark (Optional)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map(student => {
              const att = attendanceState[student.id]

              if (!att) return null

              return (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white z-10">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full object-cover" src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.email)} alt="" referrerPolicy="no-referrer" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{student.full_name || 'No Name'}</div>
                        <div className="text-sm text-gray-500">{student.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={att.morning_status}
                      onChange={(e) => handleAttendanceChange(student.id, 'morning_status', e.target.value)}
                      className={`block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${att.morning_status === 'absent' ? 'text-red-600 font-bold' : ''}`}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={att.afternoon_status}
                      onChange={(e) => handleAttendanceChange(student.id, 'afternoon_status', e.target.value)}
                      className={`block w-full rounded-md border-gray-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 ${att.afternoon_status === 'absent' ? 'text-red-600 font-bold' : ''}`}
                    >
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="leave">Leave</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap w-1/3">
                    <input
                      type="text"
                      placeholder="Remark..."
                      value={att.remarks}
                      onChange={(e) => handleAttendanceChange(student.id, 'remarks', e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
