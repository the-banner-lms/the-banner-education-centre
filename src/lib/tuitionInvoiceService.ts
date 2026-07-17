import 'server-only'

import { supabaseAdmin } from '@/utils/supabase/admin'
import { buildTuitionInvoicePdf, type TuitionInvoiceData } from '@/lib/tuitionInvoicePdf'

type DeliveryResult = {
  status: 'sent' | 'already_sent' | 'not_configured' | 'failed'
  message: string
}

type DeliveryOptions = {
  force?: boolean
  resendBatchId?: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

export async function getTuitionInvoiceData(feeId: string): Promise<TuitionInvoiceData | null> {
  const { data: fee, error: feeError } = await supabaseAdmin
    .from('monthly_tuition_fees')
    .select('id, student_id, invoice_number, month_year, status, base_status, yle_status, amount, base_amount, yle_amount, remarks, due_date, paid_at, verified_at, created_at')
    .eq('id', feeId)
    .maybeSingle()

  if (feeError || !fee?.student_id || !fee.invoice_number || !fee.due_date) return null

  const [{ data: student }, { data: settings }] = await Promise.all([
    supabaseAdmin
      .from('profiles')
      .select('full_name, email, student_number, assigned_class, assigned_subclass, address')
      .eq('id', fee.student_id)
      .eq('role', 'student')
      .maybeSingle(),
    supabaseAdmin
      .from('academic_settings')
      .select('academic_year, current_term')
      .eq('singleton', true)
      .maybeSingle(),
  ])

  if (!student || !settings) return null
  return {
    fee: fee as TuitionInvoiceData['fee'],
    student,
    settings,
  }
}

export async function sendPaidTuitionInvoiceEmail(
  feeId: string,
  options: DeliveryOptions = {},
): Promise<DeliveryResult> {
  const { data: delivery } = await supabaseAdmin
    .from('monthly_tuition_fees')
    .select('status, email_status, email_sent_at')
    .eq('id', feeId)
    .maybeSingle()

  if (!delivery || delivery.status !== 'paid') {
    return { status: 'failed', message: 'Only paid invoices can be emailed.' }
  }
  if (!options.force && delivery.email_status === 'sent' && delivery.email_sent_at) {
    return { status: 'already_sent', message: 'Payment email was already sent.' }
  }

  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PAYMENT_EMAIL_FROM
  if (!apiKey || !from) {
    await supabaseAdmin.from('monthly_tuition_fees').update({
      email_status: 'not_configured',
      email_error: 'Payment email provider is not configured.',
    }).eq('id', feeId)
    return { status: 'not_configured', message: 'Payment saved; email provider configuration is required.' }
  }

  const invoice = await getTuitionInvoiceData(feeId)
  if (!invoice) {
    await supabaseAdmin.from('monthly_tuition_fees').update({
      email_status: 'failed',
      email_error: 'Invoice data could not be loaded.',
    }).eq('id', feeId)
    return { status: 'failed', message: 'Payment saved; invoice email could not be prepared.' }
  }

  try {
    const pdf = await buildTuitionInvoicePdf(invoice)
    const studentName = invoice.student.full_name || 'Student'
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': options.force
          ? `tuition-paid-resend-${options.resendBatchId || crypto.randomUUID()}-${feeId}`
          : `tuition-paid-${feeId}-${invoice.fee.invoice_number}`,
      },
      body: JSON.stringify({
        from,
        to: [invoice.student.email],
        reply_to: process.env.PAYMENT_EMAIL_REPLY_TO || undefined,
        subject: `Payment verified · ${invoice.fee.invoice_number}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#16231a">
            <div style="background:#0d6831;color:white;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="margin:0;font-size:22px">The Banner Education Centre</h1>
              <p style="margin:8px 0 0">Monthly tuition payment verified</p>
            </div>
            <div style="border:1px solid #dbe5dd;border-top:0;padding:24px;border-radius:0 0 12px 12px">
              <p>Dear ${escapeHtml(studentName)},</p>
              <p>Your tuition payment for <strong>${escapeHtml(invoice.fee.month_year)}</strong> has been verified.</p>
              <p><strong>Invoice:</strong> ${escapeHtml(invoice.fee.invoice_number)}<br>
              <strong>Amount:</strong> ${new Intl.NumberFormat('en-US').format(Number(invoice.fee.amount || 0))} MMK<br>
              <strong>Status:</strong> PAID &amp; VERIFIED</p>
              <p>Your invoice/receipt PDF is attached to this email and is also available from your student dashboard.</p>
              <p style="margin-top:28px">Thank you,<br><strong>The Banner Education Centre</strong></p>
            </div>
          </div>`,
        attachments: [{
          filename: `${invoice.fee.invoice_number}.pdf`,
          content: pdf.toString('base64'),
        }],
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 350)
      throw new Error(`Email provider rejected the request (${response.status}): ${detail}`)
    }

    await supabaseAdmin.from('monthly_tuition_fees').update({
      email_status: 'sent',
      email_sent_at: new Date().toISOString(),
      email_error: null,
    }).eq('id', feeId)
    return { status: 'sent', message: `Payment email sent to ${invoice.student.email}.` }
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : 'Unknown email delivery error.'
    console.error('Paid tuition email failed:', detail)
    await supabaseAdmin.from('monthly_tuition_fees').update({
      email_status: 'failed',
      email_error: detail,
    }).eq('id', feeId)
    return { status: 'failed', message: 'Payment saved; email delivery failed and can be retried.' }
  }
}

export async function sendPaidTuitionInvoiceEmails(
  feeIds: string[],
  options: DeliveryOptions = {},
) {
  const results: DeliveryResult[] = []
  for (let index = 0; index < feeIds.length; index += 8) {
    const batch = feeIds.slice(index, index + 8)
    results.push(...await Promise.all(batch.map(feeId => sendPaidTuitionInvoiceEmail(feeId, options))))
  }
  return {
    sent: results.filter(result => result.status === 'sent').length,
    alreadySent: results.filter(result => result.status === 'already_sent').length,
    notConfigured: results.filter(result => result.status === 'not_configured').length,
    failed: results.filter(result => result.status === 'failed').length,
  }
}
