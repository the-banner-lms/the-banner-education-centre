import 'server-only'

import { revalidatePath } from 'next/cache'
import { supabaseAdmin } from '@/utils/supabase/admin'

export async function approveStudentsWithVerifiedPayments(studentIds: string[]) {
  const uniqueStudentIds = [...new Set(studentIds.filter(Boolean))]
  if (uniqueStudentIds.length === 0) return

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ approval_status: 'approved' })
    .eq('role', 'student')
    .in('id', uniqueStudentIds)

  if (error) {
    console.error('Verified student accounts could not be approved:', error)
    throw new Error('Payment was saved, but the student pending status could not be cleared.')
  }
}

export function revalidateStudentApprovalViews(studentIds: string[] = []) {
  // AuthGuard and Navbar live in the root layout. Invalidating it clears stale
  // pending-account messages in every signed-in view immediately.
  revalidatePath('/', 'layout')
  revalidatePath('/admin/users')
  revalidatePath('/admin/guests')
  revalidatePath('/admin/students')
  revalidatePath('/staff/students')
  revalidatePath('/admin/students/fast-entry')
  revalidatePath('/staff/students/fast-entry')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/[id]', 'page')

  studentIds.forEach(studentId => {
    revalidatePath(`/admin/students/${studentId}`)
    revalidatePath(`/staff/students/${studentId}`)
    revalidatePath(`/dashboard/${studentId}`)
  })
}
