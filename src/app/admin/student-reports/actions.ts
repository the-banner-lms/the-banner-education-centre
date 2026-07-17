'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { resendStudentReport } from '@/lib/studentReportDelivery'

export async function resendReportEmail(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (!profile || !['admin', 'staff'].includes(profile.role)) return
  const deliveryId = String(formData.get('deliveryId') || '')
  if (!deliveryId) return
  await resendStudentReport(deliveryId)
  revalidatePath('/admin/student-reports')
}
