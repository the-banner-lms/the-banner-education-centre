import 'server-only'

import { supabaseAdmin } from '@/utils/supabase/admin'

export type EnrollmentReviewNotice = {
  id: string
  submission_type: 'new_enrollment' | 'monthly_payment'
  status: 'completed' | 'rejected'
  payment_month: string | null
  review_reason: string | null
  reviewed_at: string
  tracking_code: string
  notice_read_at: string | null
}

export async function getEnrollmentReviewNotices(
  email: string,
  studentNumber: string | null | undefined,
  options: { unreadOnly?: boolean; limit?: number } = {},
) {
  const limit = Math.min(Math.max(options.limit || 10, 1), 30)
  const selectFields = 'id, submission_type, status, payment_month, review_reason, reviewed_at, tracking_code, notice_read_at'

  const buildQuery = () => {
    let query = supabaseAdmin
      .from('enrollment_submissions')
      .select(selectFields)
      .in('status', ['completed', 'rejected'])
      .not('reviewed_at', 'is', null)
      .order('reviewed_at', { ascending: false })
      .limit(limit)

    if (options.unreadOnly) query = query.is('notice_read_at', null)
    return query
  }

  const queries = [buildQuery().ilike('email', email)]
  if (studentNumber) queries.push(buildQuery().eq('student_number', studentNumber))

  const results = await Promise.all(queries)
  const notices = new Map<string, EnrollmentReviewNotice>()
  results.forEach(result => {
    if (result.error) console.error('Failed to load enrollment review notice:', result.error)
    ;(result.data || []).forEach(record => notices.set(record.id, record as EnrollmentReviewNotice))
  })

  return [...notices.values()]
    .sort((first, second) => new Date(second.reviewed_at).getTime() - new Date(first.reviewed_at).getTime())
    .slice(0, limit)
}
