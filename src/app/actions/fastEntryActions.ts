'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendPaidTuitionInvoiceEmails } from '@/lib/tuitionInvoiceService'
import { approveStudentsWithVerifiedPayments, revalidateStudentApprovalViews } from '@/lib/studentApproval'
import { getOverallTuitionStatus, type TuitionStatus } from '@/lib/tuition'

export type AttendanceEntry = {
  student_id: string
  morning_status: string
  afternoon_status: string
  remarks?: string
}

export type TuitionEntry = {
  student_id: string
  status: TuitionStatus
  base_status: TuitionStatus
  yle_status: TuitionStatus
  amount: number
  base_amount: number
  yle_amount: number
  remarks?: string
  recorded?: boolean
}

export async function bulkSaveMonthlyTuition(
  monthYear: string,
  tuitionData: TuitionEntry[]
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return { error: 'Insufficient permissions' }
  }

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)) {
    return { error: 'Invalid tuition month' }
  }

  if (!Array.isArray(tuitionData) || tuitionData.length > 500) {
    return { error: 'Invalid tuition data' }
  }

  const entriesToSave = tuitionData.filter(entry =>
    entry.recorded || entry.base_amount > 0 || entry.yle_amount > 0
      || entry.base_status !== 'unpaid' || entry.yle_status !== 'unpaid'
      || Boolean(entry.remarks?.trim())
  )
  const studentIds = [...new Set(entriesToSave.map(entry => entry.student_id))]
  if (studentIds.length !== entriesToSave.length) {
    return { error: 'Duplicate student records found' }
  }

  const invalidEntry = entriesToSave.find(entry => {
    const baseAmount = Number(entry.base_amount)
    const yleAmount = Number(entry.yle_amount)
    const amount = baseAmount + yleAmount
    return !entry.student_id
      || !['paid', 'unpaid', 'scholar'].includes(entry.base_status)
      || !['paid', 'unpaid', 'scholar'].includes(entry.yle_status)
      || !Number.isFinite(baseAmount)
      || !Number.isFinite(yleAmount)
      || amount < 0
      || amount > 100000000
      || baseAmount < 0
      || yleAmount < 0
      || (entry.remarks?.length || 0) > 500
  })
  if (invalidEntry) return { error: 'One or more tuition records are invalid' }

  let studentsById = new Map<string, { assigned_class: string | null; assigned_subclass: string | null }>()
  if (studentIds.length > 0) {
    const { data: validStudents, error: studentError } = await supabase
      .from('profiles')
      .select('id, assigned_class, assigned_subclass')
      .eq('role', 'student')
      .in('id', studentIds)

    if (studentError || validStudents?.length !== studentIds.length) {
      return { error: 'One or more student records are invalid' }
    }
    studentsById = new Map(validStudents.map(student => [student.id, student]))
  }

  const assignmentMismatch = entriesToSave.some(entry => {
    const student = studentsById.get(entry.student_id)
    return (student?.assigned_class === 'yle' && Number(entry.base_amount) !== 0)
      || (!student?.assigned_subclass && Number(entry.yle_amount) !== 0)
  })
  if (assignmentMismatch) return { error: 'Base or YLE payment does not match the student assignment' }

  const { data: existingFees, error: existingFeeError } = studentIds.length > 0
    ? await supabase
      .from('monthly_tuition_fees')
      .select('student_id, status, base_status, yle_status, email_status, email_sent_at')
      .eq('month_year', monthYear)
      .in('student_id', studentIds)
    : { data: [], error: null }

  if (existingFeeError) return { error: 'Unable to check existing tuition records' }
  const existingByStudent = new Map((existingFees || []).map(fee => [fee.student_id, fee]))
  const now = new Date().toISOString()

  const tuitionUpserts = entriesToSave.map(entry => {
    const existing = existingByStudent.get(entry.student_id)
    const emailAlreadySent = existing?.email_status === 'sent' && Boolean(existing.email_sent_at)
    const baseAmount = Math.round(Number(entry.base_amount) * 100) / 100
    const yleAmount = Math.round(Number(entry.yle_amount) * 100) / 100
    const totalAmount = Math.round((baseAmount + yleAmount) * 100) / 100
    const student = studentsById.get(entry.student_id)
    const baseStatus = student?.assigned_class === 'yle' ? null : entry.base_status
    const yleStatus = student?.assigned_subclass ? entry.yle_status : null
    const overallStatus = getOverallTuitionStatus(baseStatus, yleStatus)
    return {
      student_id: entry.student_id,
      month_year: monthYear,
      status: overallStatus,
      base_status: baseStatus,
      yle_status: yleStatus,
      amount: totalAmount,
      base_amount: baseAmount,
      yle_amount: yleAmount,
      remarks: entry.remarks?.trim() || '',
      staff_id: user.id,
      verified_by: overallStatus === 'paid' ? user.id : null,
      verified_at: overallStatus === 'paid' ? now : null,
      paid_at: overallStatus === 'paid' ? now : null,
      email_status: overallStatus === 'paid'
        ? emailAlreadySent ? 'sent' : 'pending'
        : 'not_applicable',
      email_sent_at: existing?.email_sent_at || null,
      email_error: null,
    }
  })

  let savedRows: Array<{ id: string; status: string; email_status: string }> = []
  if (tuitionUpserts.length > 0) {
    const { data, error: tuiError } = await supabase
      .from('monthly_tuition_fees')
      .upsert(tuitionUpserts, { onConflict: 'student_id, month_year' })
      .select('id, status, email_status')

    if (tuiError) {
      console.error('Error upserting tuition fees:', tuiError)
      return { error: 'Failed to save tuition fees' }
    }
    savedRows = data || []
  }

  const paidStudentIds = entriesToSave
    .filter(entry => {
      const student = studentsById.get(entry.student_id)
      return getOverallTuitionStatus(
        student?.assigned_class === 'yle' ? null : entry.base_status,
        student?.assigned_subclass ? entry.yle_status : null,
      ) === 'paid'
    })
    .map(entry => entry.student_id)
  await approveStudentsWithVerifiedPayments(paidStudentIds)

  revalidatePath('/admin/students/fast-entry')
  revalidatePath('/staff/students/fast-entry')
  revalidatePath('/dashboard/[id]', 'page')
  revalidatePath('/dashboard', 'page')
  revalidateStudentApprovalViews(paidStudentIds)

  const pendingEmailIds = savedRows
    .filter(row => row.status === 'paid' && row.email_status !== 'sent')
    .map(row => row.id)
  const emailDelivery = pendingEmailIds.length
    ? await sendPaidTuitionInvoiceEmails(pendingEmailIds)
    : { sent: 0, alreadySent: 0, notConfigured: 0, failed: 0 }

  return { success: true, savedCount: tuitionUpserts.length, emailDelivery }
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
