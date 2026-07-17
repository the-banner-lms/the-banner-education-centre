'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient as createServerClient } from '@/utils/supabase/server'
import { isStudentClass, isYleSubclass } from '@/lib/studentClasses'
import { sendPaidTuitionInvoiceEmail } from '@/lib/tuitionInvoiceService'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// For functions that Teachers, Staff, and Admins can do (e.g., grading, attendance)
async function verifyTeacherAccess() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'admin' || profile?.role === 'staff' || profile?.role === 'teacher'
  if (!hasAccess) {
    throw new Error('Unauthorized: Only teachers/staff/admins can perform this action.')
  }
  return user.id
}

// For functions that only Staff and Admins can do (e.g., tuition fees, profile edits)
async function verifyStaffAccess() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  const hasAccess = profile?.role === 'admin' || profile?.role === 'staff'
  if (!hasAccess) {
    throw new Error('Unauthorized: Only staff/admins can perform this action.')
  }
  return user.id
}

export type ManualStudentState = {
  error: string | null
}

export type StudentAssignmentState = {
  error: string | null
  success: string | null
}

async function createStudentNumber(assignedClass: string) {
  const { data, error } = await supabaseAdmin.rpc('next_student_number', {
    p_class_code: assignedClass,
  })

  if (error || typeof data !== 'string') {
    console.error('Error generating student number:', error)
    throw new Error('Failed to generate a student ID.')
  }

  return data
}

export async function createManualStudent(
  _previousState: ManualStudentState,
  formData: FormData
): Promise<ManualStudentState> {
  try {
    await verifyStaffAccess()
  } catch {
    return { error: 'You do not have permission to create student accounts.' }
  }

  const fullName = String(formData.get('full_name') || '').trim().replace(/\s+/g, ' ')
  const email = String(formData.get('email') || '').trim().toLowerCase()
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirm_password') || '')
  const assignedClass = String(formData.get('assigned_class') || '')
  const requestedSubclass = String(formData.get('assigned_subclass') || '')
  const yleMonthlyFeeText = String(formData.get('yle_monthly_fee') || '').trim().replace(/,/g, '')
  const address = String(formData.get('address') || '').trim().replace(/\s+/g, ' ')
  const requestedStatus = String(formData.get('approval_status') || 'approved')
  const approvalStatus = requestedStatus === 'pending' ? 'pending' : 'approved'
  const requestedBasePath = String(formData.get('base_path') || '')
  const basePath = requestedBasePath === '/staff/students'
    ? '/staff/students'
    : '/admin/students'

  if (fullName.length < 2 || fullName.length > 100) {
    return { error: 'Full name must be between 2 and 100 characters.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Enter a valid email address.' }
  }

  if (password.length < 8) {
    return { error: 'Temporary password must contain at least 8 characters.' }
  }

  if (password !== confirmPassword) {
    return { error: 'The passwords do not match.' }
  }

  if (!isStudentClass(assignedClass)) {
    return { error: 'Select a valid class for the student.' }
  }

  if (assignedClass === 'yle' && !isYleSubclass(requestedSubclass)) {
    return { error: 'Select a valid YLE sub-class for the student.' }
  }

  if (assignedClass !== 'pre-kg' && requestedSubclass && !isYleSubclass(requestedSubclass)) {
    return { error: 'Select a valid YLE sub-class for the student.' }
  }

  const assignedSubclass = assignedClass === 'pre-kg' ? null : requestedSubclass || null
  const yleMonthlyFee = assignedSubclass && yleMonthlyFeeText !== '' ? Number(yleMonthlyFeeText) : null

  if (yleMonthlyFee !== null && (!Number.isFinite(yleMonthlyFee) || yleMonthlyFee < 0 || yleMonthlyFee > 100000000)) {
    return { error: 'Enter a valid YLE monthly tuition fee.' }
  }

  if (address.length < 3 || address.length > 300) {
    return { error: 'Address must be between 3 and 300 characters.' }
  }

  const { data: authData, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
      assigned_class: assignedClass,
      assigned_subclass: assignedSubclass,
      yle_monthly_fee: yleMonthlyFee,
      address,
    },
  })

  if (createError || !authData.user) {
    const message = createError?.message?.toLowerCase().includes('already')
      ? 'A user with this email address already exists.'
      : createError?.message || 'Failed to create the student account.'
    return { error: message }
  }

  const studentId = authData.user.id
  let studentNumber: string
  try {
    studentNumber = await createStudentNumber(assignedClass)
  } catch {
    await supabaseAdmin.auth.admin.deleteUser(studentId)
    return { error: 'A unique student ID could not be generated.' }
  }

  const { error: profileError } = await supabaseAdmin
    .from('profiles')
    .update({
      email,
      full_name: fullName,
      assigned_class: assignedClass,
      assigned_subclass: assignedSubclass,
      yle_monthly_fee: yleMonthlyFee,
      address,
      student_number: studentNumber,
      role: 'student',
      approval_status: approvalStatus,
    })
    .eq('id', studentId)
    .select('id')
    .single()

  if (profileError) {
    console.error('Error creating manual student profile:', profileError)
    await supabaseAdmin.auth.admin.deleteUser(studentId)
    return { error: 'The login account could not be linked to a student profile.' }
  }

  revalidatePath('/admin/students')
  revalidatePath('/staff/students')
  revalidatePath('/admin/users')
  redirect(`${basePath}/${studentId}`)
}

export async function updateStudentDetails(
  studentId: string,
  _previousState: StudentAssignmentState,
  formData: FormData,
): Promise<StudentAssignmentState> {
  try {
    await verifyStaffAccess()
  } catch {
    return { error: 'You do not have permission to update student assignments.', success: null }
  }

  const assignedClass = String(formData.get('assigned_class') || '')
  const requestedSubclass = String(formData.get('assigned_subclass') || '')
  const yleMonthlyFeeText = String(formData.get('yle_monthly_fee') || '').trim().replace(/,/g, '')
  const address = String(formData.get('address') || '').trim().replace(/\s+/g, ' ')
  if (!isStudentClass(assignedClass)) {
    return { error: 'Select a valid student class.', success: null }
  }

  if (assignedClass === 'yle' && !isYleSubclass(requestedSubclass)) {
    return { error: 'Select a valid YLE sub-class.', success: null }
  }

  if (assignedClass !== 'pre-kg' && requestedSubclass && !isYleSubclass(requestedSubclass)) {
    return { error: 'Select a valid YLE sub-class.', success: null }
  }

  const assignedSubclass = assignedClass === 'pre-kg' ? null : requestedSubclass || null
  const yleMonthlyFee = assignedSubclass && yleMonthlyFeeText !== '' ? Number(yleMonthlyFeeText) : null

  if (yleMonthlyFee !== null && (!Number.isFinite(yleMonthlyFee) || yleMonthlyFee < 0 || yleMonthlyFee > 100000000)) {
    return { error: 'Enter a valid YLE monthly tuition fee.', success: null }
  }

  if (address.length < 3 || address.length > 300) {
    return { error: 'Address must be between 3 and 300 characters.', success: null }
  }

  const { data: currentStudent, error: studentLookupError } = await supabaseAdmin
    .from('profiles')
    .select('student_number')
    .eq('id', studentId)
    .eq('role', 'student')
    .single()

  if (studentLookupError || !currentStudent) {
    return { error: 'Student profile not found.', success: null }
  }

  let studentNumber = currentStudent.student_number
  if (!studentNumber) {
    try {
      studentNumber = await createStudentNumber(assignedClass)
    } catch {
      return { error: 'A unique student ID could not be generated.', success: null }
    }
  }

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({
      assigned_class: assignedClass,
      assigned_subclass: assignedSubclass,
      yle_monthly_fee: yleMonthlyFee,
      address,
      student_number: studentNumber,
    })
    .eq('id', studentId)
    .eq('role', 'student')
    .select('id')
    .single()

  if (error) {
    console.error('Error updating student details:', error)
    return { error: 'Failed to update the student class, YLE assignment and address.', success: null }
  }

  revalidatePath('/admin/students')
  revalidatePath('/staff/students')
  revalidatePath('/teacher/students')
  revalidatePath(`/admin/students/${studentId}`)
  revalidatePath(`/staff/students/${studentId}`)
  revalidatePath(`/teacher/students/${studentId}`)
  revalidatePath(`/dashboard/${studentId}`)
  return { error: null, success: 'Student assignment, YLE tuition fee and address saved.' }
}

export async function uploadProfilePicture(studentId: string, formData: FormData) {
  // We'll let teachers update profile pictures for their students as well, but maybe staff is safer. 
  // Let's use verifyTeacherAccess so teachers can do it.
  await verifyTeacherAccess()
  
  const file = formData.get('file') as File
  if (!file) throw new Error('No file provided')

  const fileExt = file.name.split('.').pop()
  const fileName = `${studentId}-${Math.random()}.${fileExt}`
  
  // Upload to Supabase Storage 'avatars' bucket
  const { error: uploadError } = await supabaseAdmin.storage
    .from('avatars')
    .upload(fileName, file)

  if (uploadError) {
    console.error('Error uploading image:', uploadError)
    throw new Error('Failed to upload image')
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from('avatars')
    .getPublicUrl(fileName)

  // Update profile
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', studentId)

  if (updateError) {
    throw new Error('Failed to update profile picture URL')
  }

  revalidatePath(`/admin/students/${studentId}`)
  revalidatePath(`/teacher/students/${studentId}`)
  revalidatePath(`/staff/students/${studentId}`)
  return { success: true, avatar_url: publicUrl }
}

export async function saveWeeklyPerformance(data: {
  student_id: string
  week_start_date: string
  burmese_score: string
  english_score: string
  math_score: string
  science_score: string
  sports_score: string
  art_score: string
  social_score: string
  health_score: string
  teamwork_score: string
  discipline_score: string
  remarks: string
}) {
  const staffId = await verifyTeacherAccess() // teacher/staff/admin

  const { error } = await supabaseAdmin
    .from('weekly_performances')
    .insert({
      ...data,
      staff_id: staffId // this refers to the ID of the person saving it
    })

  if (error) {
    console.error('Error saving performance:', error)
    throw new Error('Failed to save performance record')
  }

  revalidatePath(`/admin/students/${data.student_id}`)
  revalidatePath(`/teacher/students/${data.student_id}`)
  revalidatePath(`/staff/students/${data.student_id}`)
  return { success: true }
}

export async function markDailyAttendance(data: {
  student_id: string;
  date: string;
  morning_status: string;
  afternoon_status: string;
  remarks?: string;
}) {
  const staffId = await verifyTeacherAccess() // teacher/staff/admin

  // UPSERT the daily attendance record
  const { error } = await supabaseAdmin
    .from('daily_attendance')
    .upsert({
      student_id: data.student_id,
      date: data.date,
      morning_status: data.morning_status,
      afternoon_status: data.afternoon_status,
      remarks: data.remarks || '',
      staff_id: staffId
    }, {
      onConflict: 'student_id, date'
    })

  if (error) {
    console.error('Error saving attendance:', error)
    throw new Error('Failed to save attendance record')
  }

  revalidatePath(`/admin/students/${data.student_id}`)
  revalidatePath(`/teacher/students/${data.student_id}`)
  revalidatePath(`/staff/students/${data.student_id}`)
  return { success: true }
}

export async function recordMonthlyTuitionFee(data: {
  student_id: string;
  month_year: string;
  status: string;
  amount: number;
  remarks: string;
}) {
  // Only Staff and Admin can record tuition fees
  const staffId = await verifyStaffAccess()

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.month_year)) {
    throw new Error('Select a valid tuition month')
  }
  if (!['paid', 'unpaid', 'scholar'].includes(data.status)) {
    throw new Error('Select a valid tuition status')
  }
  const amount = Number(data.amount)
  if (!Number.isFinite(amount) || amount < 0 || amount > 100000000) {
    throw new Error('Enter a valid monthly fee amount')
  }
  if (data.remarks.length > 500) {
    throw new Error('Remarks must be 500 characters or fewer')
  }

  const { data: existingFee } = await supabaseAdmin
    .from('monthly_tuition_fees')
    .select('email_status, email_sent_at')
    .eq('student_id', data.student_id)
    .eq('month_year', data.month_year)
    .maybeSingle()
  const emailAlreadySent = existingFee?.email_status === 'sent' && Boolean(existingFee.email_sent_at)
  const now = new Date().toISOString()

  const { data: savedFee, error } = await supabaseAdmin
    .from('monthly_tuition_fees')
    .upsert({
      student_id: data.student_id,
      month_year: data.month_year,
      status: data.status,
      amount: Math.round(amount * 100) / 100,
      remarks: data.remarks,
      staff_id: staffId,
      verified_by: data.status === 'paid' ? staffId : null,
      verified_at: data.status === 'paid' ? now : null,
      paid_at: data.status === 'paid' ? now : null,
      email_status: data.status === 'paid'
        ? emailAlreadySent ? 'sent' : 'pending'
        : 'not_applicable',
      email_sent_at: existingFee?.email_sent_at || null,
      email_error: null,
    }, {
      onConflict: 'student_id,month_year'
    })
    .select('id')
    .single()

  if (error || !savedFee) {
    console.error('Error recording tuition fee:', error)
    throw new Error('Failed to record tuition fee')
  }

  revalidatePath(`/admin/students/${data.student_id}`)
  revalidatePath(`/staff/students/${data.student_id}`)
  revalidatePath(`/dashboard`)
  revalidatePath(`/dashboard/${data.student_id}`)

  const emailDelivery = data.status === 'paid' && !emailAlreadySent
    ? await sendPaidTuitionInvoiceEmail(savedFee.id)
    : null
  return { success: true, emailDelivery }
}
