import 'server-only'

import { supabaseAdmin } from '@/utils/supabase/admin'
import {
  buildStudentReportPdf,
  loadAvatarImage,
  type AttendanceRecord,
  type PerformanceRecord,
  type TuitionFeeRecord,
} from '@/app/api/student-report/route'
import {
  addIsoDays,
  formatReportPeriod,
  getMonday,
  getMyanmarToday,
  getPreviousMonth,
  getReportReleaseAt,
  monthBounds,
  type StudentReportType,
} from '@/lib/studentReportPeriods'

type ReportDelivery = {
  id: string
  student_id: string
  report_type: StudentReportType
  period_key: string
  period_start: string
  period_end: string
  attempt_count: number
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function prepareReportPdf(delivery: ReportDelivery) {
  const [{ data: profile }, performanceResult, attendanceResult, tuitionResult] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('full_name, email, role, student_number, avatar_url')
      .eq('id', delivery.student_id)
      .eq('role', 'student')
      .maybeSingle(),
    supabaseAdmin
      .from('weekly_performances')
      .select('week_start_date, burmese_score, english_score, math_score, science_score, sports_score, art_score, social_score, health_score, teamwork_score, discipline_score, remarks')
      .eq('student_id', delivery.student_id)
      .gte('week_start_date', delivery.period_start)
      .lte('week_start_date', delivery.period_end)
      .order('week_start_date', { ascending: true }),
    supabaseAdmin
      .from('daily_attendance')
      .select('date, morning_status, afternoon_status')
      .eq('student_id', delivery.student_id)
      .gte('date', delivery.period_start)
      .lte('date', delivery.period_end)
      .order('date'),
    supabaseAdmin
      .from('monthly_tuition_fees')
      .select('month_year, status, amount, remarks, created_at')
      .eq('student_id', delivery.student_id)
      .gte('month_year', delivery.report_type === 'monthly' ? delivery.period_key : '0000-00')
      .lte('month_year', delivery.report_type === 'monthly' ? delivery.period_key : '9999-99')
      .order('month_year', { ascending: false })
      .limit(delivery.report_type === 'monthly' ? 1 : 12),
  ])

  if (!profile?.email || performanceResult.error || attendanceResult.error || tuitionResult.error) {
    throw new Error('Student report data could not be loaded.')
  }

  const avatarImage = await loadAvatarImage(profile.avatar_url)
  const pdf = await buildStudentReportPdf({
    profile,
    reportType: delivery.report_type,
    weekStart: delivery.period_start,
    periodEnd: delivery.period_end,
    performances: (performanceResult.data || []) as PerformanceRecord[],
    attendance: (attendanceResult.data || []) as AttendanceRecord[],
    tuitionFees: (tuitionResult.data || []) as TuitionFeeRecord[],
    avatarImage,
  })
  return { pdf, profile }
}

async function deliverReport(delivery: ReportDelivery) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.REPORT_EMAIL_FROM || process.env.PAYMENT_EMAIL_FROM
  if (!apiKey || !from) {
    await supabaseAdmin.from('student_report_deliveries').update({
      email_status: 'not_configured',
      email_error: 'Report email provider is not configured.',
      attempt_count: delivery.attempt_count + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', delivery.id)
    return 'not_configured' as const
  }

  try {
    const { pdf, profile } = await prepareReportPdf(delivery)
    const reportLabel = delivery.report_type === 'monthly' ? 'Monthly Summary' : 'Weekly Report'
    const periodLabel = formatReportPeriod(delivery.report_type, delivery.period_key)
    const filename = `TBEC-${delivery.report_type}-report-${delivery.period_key}.pdf`
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `student-report-${delivery.id}`,
      },
      body: JSON.stringify({
        from,
        to: [profile.email],
        reply_to: process.env.REPORT_EMAIL_REPLY_TO || process.env.PAYMENT_EMAIL_REPLY_TO || undefined,
        subject: `${reportLabel} · ${periodLabel}`,
        html: `
          <div style="font-family:Arial,'Noto Sans Myanmar',sans-serif;max-width:620px;margin:auto;color:#16231a">
            <div style="background:#0d6831;color:white;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="margin:0;font-size:22px">The Banner Education Centre</h1>
              <p style="margin:8px 0 0">${escapeHtml(reportLabel)}</p>
            </div>
            <div style="border:1px solid #dbe5dd;border-top:0;padding:24px;border-radius:0 0 12px 12px">
              <p>မင်္ဂလာပါ ${escapeHtml(profile.full_name || 'Student')}၊</p>
              <p><strong>${escapeHtml(periodLabel)}</strong> အတွက် ကျောင်းသားအစီရင်ခံစာကို ပူးတွဲပေးပို့ထားပါသည်။</p>
              <p>Student Dashboard မှလည်း အချိန်မရွေး ပြန်လည် download ရယူနိုင်ပါသည်။</p>
              <p style="margin-top:28px">The Banner Education Centre</p>
            </div>
          </div>`,
        attachments: [{ filename, content: pdf.toString('base64') }],
      }),
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) throw new Error(`Email provider rejected the request (${response.status}): ${(await response.text()).slice(0, 300)}`)

    await supabaseAdmin.from('student_report_deliveries').update({
      email_status: 'sent',
      email_sent_at: new Date().toISOString(),
      email_error: null,
      attempt_count: delivery.attempt_count + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', delivery.id)
    return 'sent' as const
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : 'Unknown report delivery error.'
    console.error('Student report email failed:', detail)
    await supabaseAdmin.from('student_report_deliveries').update({
      email_status: 'failed',
      email_error: detail,
      attempt_count: delivery.attempt_count + 1,
      updated_at: new Date().toISOString(),
    }).eq('id', delivery.id)
    return 'failed' as const
  }
}

async function enqueueReport(type: StudentReportType, periodKey: string) {
  const { data: students, error } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'student')
    .not('email', 'is', null)
  if (error) throw error

  const bounds = type === 'monthly'
    ? monthBounds(periodKey)
    : { start: periodKey, end: addIsoDays(periodKey, 6) }
  if (!students?.length) return 0

  const rows = students.map(student => ({
    student_id: student.id,
    report_type: type,
    period_key: periodKey,
    period_start: bounds.start,
    period_end: bounds.end,
    release_at: getReportReleaseAt(type, periodKey).toISOString(),
  }))
  const { error: upsertError } = await supabaseAdmin
    .from('student_report_deliveries')
    .upsert(rows, { onConflict: 'student_id,report_type,period_key', ignoreDuplicates: true })
  if (upsertError) throw upsertError
  return rows.length
}

export async function processDueStudentReports() {
  const today = getMyanmarToday()
  let enqueued = 0
  if (getMonday(today) === today) {
    enqueued += await enqueueReport('weekly', addIsoDays(today, -7))
  }
  if (today.endsWith('-01')) {
    enqueued += await enqueueReport('monthly', getPreviousMonth(today.slice(0, 7)))
  }

  const { data, error } = await supabaseAdmin
    .from('student_report_deliveries')
    .select('id, student_id, report_type, period_key, period_start, period_end, attempt_count')
    .in('email_status', ['pending', 'failed'])
    .lte('release_at', new Date().toISOString())
    .lt('attempt_count', 5)
    .order('release_at', { ascending: true })
    .limit(40)
  if (error) throw error

  const results: string[] = []
  for (let index = 0; index < (data || []).length; index += 5) {
    results.push(...await Promise.all((data || []).slice(index, index + 5).map(item => deliverReport(item as ReportDelivery))))
  }
  return {
    enqueued,
    processed: results.length,
    sent: results.filter(result => result === 'sent').length,
    failed: results.filter(result => result === 'failed').length,
    notConfigured: results.filter(result => result === 'not_configured').length,
  }
}

export async function resendStudentReport(deliveryId: string) {
  const { data, error } = await supabaseAdmin
    .from('student_report_deliveries')
    .select('id, student_id, report_type, period_key, period_start, period_end, attempt_count')
    .eq('id', deliveryId)
    .maybeSingle()
  if (error || !data) throw new Error('Report delivery was not found.')
  await supabaseAdmin.from('student_report_deliveries').update({ email_status: 'pending', email_error: null }).eq('id', deliveryId)
  return deliverReport(data as ReportDelivery)
}
