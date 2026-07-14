'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
import { createClient as createServerClient } from '@/utils/supabase/server'

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
  remarks: string;
}) {
  // Only Staff and Admin can record tuition fees
  const staffId = await verifyStaffAccess()

  const { error } = await supabaseAdmin
    .from('monthly_tuition_fees')
    .upsert({
      student_id: data.student_id,
      month_year: data.month_year,
      status: data.status,
      remarks: data.remarks,
      staff_id: staffId
    }, {
      onConflict: 'student_id,month_year'
    })

  if (error) {
    console.error('Error recording tuition fee:', error)
    throw new Error('Failed to record tuition fee')
  }

  revalidatePath(`/admin/students/${data.student_id}`)
  revalidatePath(`/staff/students/${data.student_id}`)
  revalidatePath(`/dashboard`)
  return { success: true }
}
