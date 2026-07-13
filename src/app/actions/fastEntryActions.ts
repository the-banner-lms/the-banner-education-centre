'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export type AttendanceEntry = {
  student_id: string
  morning_status: string
  afternoon_status: string
  remarks?: string
}

export type TuitionEntry = {
  student_id: string
  status: string
  remarks?: string
}

// 1. Admin/Staff Bulk Save (Attendance + Tuition)
export async function adminBulkSave(
  date: string,
  monthYear: string,
  attendanceData: AttendanceEntry[],
  tuitionData: TuitionEntry[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  // 1. Prepare Attendance Upserts
  const attendanceUpserts = attendanceData.map(entry => ({
    student_id: entry.student_id,
    date: date,
    morning_status: entry.morning_status,
    afternoon_status: entry.afternoon_status,
    remarks: entry.remarks || '',
    staff_id: user.id
  }))

  if (attendanceUpserts.length > 0) {
    const { error: attError } = await supabase
      .from('daily_attendance')
      .upsert(attendanceUpserts, { onConflict: 'student_id, date' })

    if (attError) {
      console.error('Error upserting attendance:', attError)
      return { error: 'Failed to save attendance records' }
    }
  }

  // 2. Prepare Tuition Upserts
  const tuitionUpserts = tuitionData.map(entry => ({
    student_id: entry.student_id,
    month_year: monthYear,
    status: entry.status,
    remarks: entry.remarks || '',
    staff_id: user.id
  }))

  if (tuitionUpserts.length > 0) {
    const { error: tuiError } = await supabase
      .from('monthly_tuition_fees')
      .upsert(tuitionUpserts, { onConflict: 'student_id, month_year' })

    if (tuiError) {
      console.error('Error upserting tuition fees:', tuiError)
      return { error: 'Failed to save tuition fees' }
    }
  }

  // Revalidate relevant paths so student dashboards update immediately
  revalidatePath('/dashboard/[id]', 'page')
  revalidatePath('/dashboard', 'page')

  return { success: true }
}

// 2. Teacher Submit Daily Report (Attendance Only)
export async function submitTeacherDailyReport(
  date: string,
  attendanceData: AttendanceEntry[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || profile.role !== 'teacher') {
    return { error: 'Only teachers can submit daily reports' }
  }

  // 1. Upsert Attendance
  const attendanceUpserts = attendanceData.map(entry => ({
    student_id: entry.student_id,
    date: date,
    morning_status: entry.morning_status,
    afternoon_status: entry.afternoon_status,
    remarks: entry.remarks || '',
    staff_id: user.id // Using staff_id column to store teacher's id
  }))

  if (attendanceUpserts.length > 0) {
    const { error: attError } = await supabase
      .from('daily_attendance')
      .upsert(attendanceUpserts, { onConflict: 'student_id, date' })

    if (attError) {
      console.error('Error upserting teacher attendance:', attError)
      return { error: 'Failed to save attendance records' }
    }
  }

  // 2. Insert into teacher_daily_reports
  const { error: repError } = await supabase
    .from('teacher_daily_reports')
    .upsert({
      teacher_id: user.id,
      date: date
    }, { onConflict: 'teacher_id, date' })

  if (repError) {
    console.error('Error creating teacher daily report:', repError)
    return { error: 'Failed to create daily report record' }
  }

  revalidatePath('/admin/teacher-reports')
  revalidatePath('/staff/teacher-reports')
  
  return { success: true }
}
