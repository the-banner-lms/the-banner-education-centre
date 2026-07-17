'use server'

import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { isStudentClass, isYleSubclass } from '@/lib/studentClasses'
import { sendPaidTuitionInvoiceEmail } from '@/lib/tuitionInvoiceService'
import { splitTuitionAmount } from '@/lib/tuition'
import { approveStudentsWithVerifiedPayments, revalidateStudentApprovalViews } from '@/lib/studentApproval'
import { provisionStudentFromEnrollment, type EnrollmentStudentResult } from '@/lib/enrollmentStudentProvisioning'
import {
  analyzePaymentSlip,
  hashSubmissionFingerprint,
  isPaymentMethod,
  normalizeTransactionId,
  perceptualHashDistance,
} from '@/lib/slipValidation'

export type EnrollmentFormState = {
  status: 'idle' | 'success' | 'error'
  message: string
  referenceCode?: string
}

export type EnrollmentLookupState = {
  status: 'idle' | 'success' | 'error'
  message: string
  submission?: {
    studentName: string
    submissionType: 'new_enrollment' | 'monthly_payment'
    status: 'pending' | 'contacted' | 'completed' | 'rejected'
    paymentMonth: string | null
    reviewReason: string | null
    submittedAt: string
    reviewedAt: string | null
  }
}

export type EnrollmentReviewState = {
  status: 'idle' | 'success' | 'error'
  message: string
}

const allowedFileTypes: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf',
}

const cleanText = (formData: FormData, key: string) =>
  String(formData.get(key) || '').trim().replace(/\s+/g, ' ')

async function verifyStaffAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'staff'].includes(profile.role)) {
    throw new Error('Unauthorized')
  }

  return user.id
}

export async function submitEnrollment(
  _previousState: EnrollmentFormState,
  formData: FormData,
): Promise<EnrollmentFormState> {
  const submissionType = cleanText(formData, 'submission_type')
  const assignedClass = cleanText(formData, 'assigned_class')
  const requestedSubclass = cleanText(formData, 'assigned_subclass')
  const studentName = cleanText(formData, 'student_name')
  const email = cleanText(formData, 'email').toLowerCase()
  const contactNumber = cleanText(formData, 'contact_number')
  const viberNumber = cleanText(formData, 'viber_number')
  const address = cleanText(formData, 'address')
  const studentNumber = cleanText(formData, 'student_number').toLowerCase()
  const paymentMonth = cleanText(formData, 'payment_month')
  const paymentMethod = cleanText(formData, 'payment_method')
  const paymentAmountText = cleanText(formData, 'payment_amount').replace(/,/g, '')
  const paymentAmount = Number(paymentAmountText)
  const paymentDate = cleanText(formData, 'payment_date')
  const transactionId = normalizeTransactionId(cleanText(formData, 'transaction_id'))
  const note = cleanText(formData, 'note')
  const website = cleanText(formData, 'website')
  const paymentSlip = formData.get('payment_slip')

  // Honeypot: bots receive a normal-looking response without writing data.
  if (website) {
    return { status: 'success', message: 'Your submission has been received.' }
  }

  if (submissionType !== 'new_enrollment' && submissionType !== 'monthly_payment') {
    return { status: 'error', message: 'Please choose a valid submission type.' }
  }
  if (!isStudentClass(assignedClass)) {
    return { status: 'error', message: 'Please choose a class.' }
  }
  if (assignedClass === 'yle' && !isYleSubclass(requestedSubclass)) {
    return { status: 'error', message: 'Please choose a YLE sub-class.' }
  }
  if (assignedClass !== 'pre-kg' && requestedSubclass && !isYleSubclass(requestedSubclass)) {
    return { status: 'error', message: 'Please choose a valid YLE sub-class.' }
  }
  if (studentName.length < 2 || studentName.length > 100) {
    return { status: 'error', message: 'Student name must be between 2 and 100 characters.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }
  if (contactNumber.length < 6 || contactNumber.length > 30) {
    return { status: 'error', message: 'Please enter a valid contact number.' }
  }
  if (viberNumber.length > 30 || address.length > 300 || note.length > 1000) {
    return { status: 'error', message: 'One or more fields are too long.' }
  }
  if (submissionType === 'monthly_payment' && !/^\d{4}-(0[1-9]|1[0-2])$/.test(paymentMonth)) {
    return { status: 'error', message: 'Please choose the payment month.' }
  }
  if (studentNumber && !/^[a-z0-9-]{5,40}$/.test(studentNumber)) {
    return { status: 'error', message: 'Please enter a valid Student ID.' }
  }
  if (!isPaymentMethod(paymentMethod)) {
    return { status: 'error', message: 'Please choose the payment method.' }
  }
  const isDirectPayment = paymentMethod === 'direct'
  if (!Number.isFinite(paymentAmount) || paymentAmount <= 0 || paymentAmount > 100000000) {
    return { status: 'error', message: 'Please enter a valid payment amount.' }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate) || Number.isNaN(new Date(`${paymentDate}T00:00:00Z`).getTime())) {
    return { status: 'error', message: 'Please enter a valid payment date.' }
  }
  if (!isDirectPayment && !/^\d{5}$/.test(transactionId)) {
    return { status: 'error', message: 'Enter the last 5 digits of the Transaction ID.' }
  }
  if (!isDirectPayment && (!(paymentSlip instanceof File) || paymentSlip.size === 0)) {
    return { status: 'error', message: 'Please attach the payment slip.' }
  }
  if (!isDirectPayment && paymentSlip instanceof File && (paymentSlip.size > 4 * 1024 * 1024 || !allowedFileTypes[paymentSlip.type])) {
    return { status: 'error', message: 'Payment slip must be a JPG, PNG, WebP or PDF file under 4 MB.' }
  }

  const requestHeaders = await headers()
  const ipAddress = (requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || 'unknown')
    .split(',')[0]
    .trim()
  const fingerprint = hashSubmissionFingerprint(ipAddress, requestHeaders.get('user-agent') || 'unknown')
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString()
  const { count: recentSubmissionCount } = await supabaseAdmin
    .from('enrollment_submissions')
    .select('id', { count: 'exact', head: true })
    .eq('submitter_fingerprint', fingerprint)
    .gte('created_at', fifteenMinutesAgo)

  if ((recentSubmissionCount || 0) >= 3) {
    return { status: 'error', message: 'Too many recent submissions. Please wait 15 minutes and try again.' }
  }

  let duplicateSubmissionQuery = supabaseAdmin
    .from('enrollment_submissions')
    .select('id')
    .eq('submission_type', submissionType)
    .neq('status', 'rejected')
    .limit(1)

  if (submissionType === 'monthly_payment') {
    duplicateSubmissionQuery = duplicateSubmissionQuery
      .eq('payment_month', paymentMonth)
      .eq(studentNumber ? 'student_number' : 'email', studentNumber || email)
  } else {
    duplicateSubmissionQuery = duplicateSubmissionQuery
      .ilike('email', email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  }

  const { data: duplicateSubmission } = await duplicateSubmissionQuery.maybeSingle()
  if (duplicateSubmission) {
    return {
      status: 'error',
      message: submissionType === 'monthly_payment'
        ? 'A payment submission already exists for this student and month. Check its status before submitting again.'
        : 'An enrollment submission already exists for this email. Please check its status.',
    }
  }

  let analysis: Awaited<ReturnType<typeof analyzePaymentSlip>> | null = null
  let paymentSlipPath: string | null = null
  const validationFlags: string[] = isDirectPayment ? ['direct_payment_no_slip'] : []

  if (!isDirectPayment) {
    if (!(paymentSlip instanceof File)) {
      return { status: 'error', message: 'Please attach the payment slip.' }
    }

    const { data: duplicateTransaction } = await supabaseAdmin
      .from('enrollment_submissions')
      .select('id')
      .eq('payment_method', paymentMethod)
      .eq('payment_date', paymentDate)
      .ilike('transaction_id', transactionId)
      .limit(1)
      .maybeSingle()

    if (duplicateTransaction) {
      return { status: 'error', message: 'These Transaction ID last 5 digits have already been submitted for this payment method and date. Upload rejected.' }
    }

    analysis = await analyzePaymentSlip(paymentSlip)
    if (analysis.hardError) {
      return { status: 'error', message: analysis.hardError }
    }

    const { data: exactDuplicate } = await supabaseAdmin
      .from('enrollment_submissions')
      .select('id')
      .eq('slip_sha256', analysis.sha256)
      .limit(1)
      .maybeSingle()

    if (exactDuplicate) {
      return { status: 'error', message: 'This exact payment slip has already been submitted. Upload rejected.' }
    }

    validationFlags.push(...analysis.flags)
    if (analysis.perceptualHash) {
      const { data: recentHashes } = await supabaseAdmin
        .from('enrollment_submissions')
        .select('slip_perceptual_hash')
        .not('slip_perceptual_hash', 'is', null)
        .order('created_at', { ascending: false })
        .limit(300)

      const possibleDuplicate = (recentHashes || []).some(record =>
        record.slip_perceptual_hash
        && perceptualHashDistance(analysis!.perceptualHash!, record.slip_perceptual_hash) <= 5
      )
      if (possibleDuplicate) validationFlags.push('possible_near_duplicate')
    }

    const extension = allowedFileTypes[paymentSlip.type]
    paymentSlipPath = `${submissionType}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabaseAdmin.storage
      .from('enrollment-slips')
      .upload(paymentSlipPath, analysis.buffer, {
        contentType: analysis.detectedMimeType,
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Enrollment payment slip upload failed:', uploadError)
      return { status: 'error', message: 'Payment slip upload failed. Please try again.' }
    }
  }

  const submittedPaymentDate = new Date(`${paymentDate}T00:00:00Z`)
  const paymentAgeDays = Math.floor((Date.now() - submittedPaymentDate.getTime()) / 86_400_000)
  if (paymentAgeDays > 7) validationFlags.push('payment_date_older_than_7_days')
  if (paymentAgeDays < -1) validationFlags.push('payment_date_in_future')

  const trackingCode = crypto.randomUUID().replace(/-/g, '')
  const { data: insertedSubmission, error: insertError } = await supabaseAdmin
    .from('enrollment_submissions')
    .insert({
      submission_type: submissionType,
      assigned_class: assignedClass,
      assigned_subclass: assignedClass === 'pre-kg' ? null : requestedSubclass || null,
      student_name: studentName,
      email,
      contact_number: contactNumber,
      viber_number: viberNumber || null,
      address: submissionType === 'new_enrollment' ? address || null : null,
      student_number: submissionType === 'monthly_payment' ? studentNumber || null : null,
      payment_month: submissionType === 'monthly_payment' ? paymentMonth : null,
      payment_method: paymentMethod,
      payment_amount: Math.round(paymentAmount * 100) / 100,
      payment_date: paymentDate,
      transaction_id: isDirectPayment ? null : transactionId,
      note: note || null,
      payment_slip_path: paymentSlipPath,
      tracking_code: trackingCode,
      slip_sha256: analysis?.sha256 || null,
      slip_perceptual_hash: analysis?.perceptualHash || null,
      slip_mime_type: analysis?.detectedMimeType || null,
      slip_size_bytes: analysis?.buffer.length || null,
      slip_width: analysis?.width || null,
      slip_height: analysis?.height || null,
      validation_status: validationFlags.length > 0 ? 'needs_review' : 'clear',
      validation_flags: validationFlags,
      submitter_fingerprint: fingerprint,
    })
    .select('tracking_code')
    .single()

  if (insertError) {
    console.error('Enrollment submission failed:', insertError)
    if (paymentSlipPath) await supabaseAdmin.storage.from('enrollment-slips').remove([paymentSlipPath])
    return { status: 'error', message: 'Submission failed. Please try again.' }
  }

  revalidatePath('/admin/enrollments')
  revalidatePath('/staff/enrollments')

  return {
    status: 'success',
    message: submissionType === 'new_enrollment'
      ? 'သင်တန်းအပ်နှံမှု ပေးပို့ပြီးပါပြီ။ Admin အတည်ပြုပြီးပါက Student ID နှင့် account ဖွင့်ရန် link ကို Email မှပို့ပေးပါမည်။ Email Inbox နှင့် Spam folder ကို စစ်ပေးပါ။ Tracking Reference ကို သိမ်းထားပါ။'
      : `${isDirectPayment ? 'Direct payment' : 'Monthly payment slip'} submitted for admin review. Keep the reference code.`,
    referenceCode: insertedSubmission?.tracking_code || trackingCode,
  }
}

export async function updateEnrollmentStatus(
  submissionId: string,
  _previousState: EnrollmentReviewState,
  formData: FormData,
): Promise<EnrollmentReviewState> {
  const reviewerId = await verifyStaffAccess()
  const status = cleanText(formData, 'status')
  const reviewReason = cleanText(formData, 'review_reason')
  if (!['pending', 'contacted', 'completed', 'rejected'].includes(status)) {
    return { status: 'error', message: 'Invalid review status.' }
  }
  if (status === 'rejected' && (reviewReason.length < 5 || reviewReason.length > 500)) {
    return { status: 'error', message: 'A rejection reason between 5 and 500 characters is required.' }
  }
  if (reviewReason.length > 500) return { status: 'error', message: 'Review notice is too long.' }

  const { data: submission, error: lookupError } = await supabaseAdmin
    .from('enrollment_submissions')
    .select('id, submission_type, assigned_class, assigned_subclass, student_name, email, address, student_number, student_profile_id, payment_month, payment_method, payment_amount, transaction_id, status')
    .eq('id', submissionId)
    .maybeSingle()

  if (lookupError || !submission) {
    return { status: 'error', message: 'Submission not found.' }
  }

  let paidFeeId: string | null = null
  let paidStudentId: string | null = null
  let enrollmentStudent: EnrollmentStudentResult | null = null
  if (status === 'completed' && submission.submission_type === 'new_enrollment') {
    try {
      enrollmentStudent = await provisionStudentFromEnrollment({
        submissionId: submission.id,
        fullName: submission.student_name,
        email: submission.email,
        assignedClass: submission.assigned_class,
        assignedSubclass: submission.assigned_subclass,
        address: submission.address,
      })
    } catch (provisionError) {
      const message = provisionError instanceof Error ? provisionError.message : 'The student account could not be created.'
      console.error('Approved enrollment provisioning failed:', provisionError)
      return { status: 'error', message }
    }
  }

  if (status === 'completed' && submission.submission_type === 'monthly_payment') {
    let student: { id: string; email: string; assigned_class: string | null; assigned_subclass: string | null; yle_monthly_fee: number | string | null } | null = null
    if (submission.student_number) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email, assigned_class, assigned_subclass, yle_monthly_fee')
        .eq('role', 'student')
        .eq('student_number', submission.student_number)
        .maybeSingle()
      student = data
    }
    if (!student) {
      const { data } = await supabaseAdmin
        .from('profiles')
        .select('id, email, assigned_class, assigned_subclass, yle_monthly_fee')
        .eq('role', 'student')
        .ilike('email', submission.email)
        .maybeSingle()
      student = data
    }

    if (!student) {
      return {
        status: 'error',
        message: 'Cannot verify payment: no existing student matches this Student ID or email.',
      }
    }
    if (!submission.payment_month || !submission.payment_amount) {
      return { status: 'error', message: 'Cannot verify payment: month or amount is missing.' }
    }

    const { data: existingFee } = await supabaseAdmin
      .from('monthly_tuition_fees')
      .select('id, status, email_status, email_sent_at')
      .eq('student_id', student.id)
      .eq('month_year', submission.payment_month)
      .maybeSingle()

    const shouldQueueEmail = !existingFee?.email_sent_at || existingFee.email_status !== 'sent'
    const totalAmount = Math.round(Number(submission.payment_amount) * 100) / 100
    const { baseAmount, yleAmount } = splitTuitionAmount({
      total: totalAmount,
      assignedClass: student.assigned_class,
      assignedSubclass: student.assigned_subclass,
      yleMonthlyFee: student.yle_monthly_fee,
    })
    const { data: paidFee, error: tuitionError } = await supabaseAdmin
      .from('monthly_tuition_fees')
      .upsert({
        student_id: student.id,
        month_year: submission.payment_month,
        status: 'paid',
        amount: totalAmount,
        base_amount: baseAmount,
        yle_amount: yleAmount,
        remarks: reviewReason || (submission.payment_method === 'direct'
          ? 'Direct payment verified by admin'
          : `Online payment verified · Transaction ${submission.transaction_id || 'recorded'}`),
        staff_id: reviewerId,
        verified_by: reviewerId,
        verified_at: new Date().toISOString(),
        paid_at: new Date().toISOString(),
        payment_submission_id: submission.id,
        ...(shouldQueueEmail ? { email_status: 'pending', email_error: null } : {}),
      }, { onConflict: 'student_id,month_year' })
      .select('id')
      .single()

    if (tuitionError || !paidFee) {
      console.error('Verified payment could not be linked to tuition:', tuitionError)
      return { status: 'error', message: 'Payment could not be linked to the student tuition record.' }
    }
    paidFeeId = paidFee.id
    paidStudentId = student.id
  }

  const { error } = await supabaseAdmin
    .from('enrollment_submissions')
    .update({
      status,
      review_reason: reviewReason || null,
      reviewed_at: ['completed', 'rejected'].includes(status) ? new Date().toISOString() : null,
      reviewed_by: ['completed', 'rejected'].includes(status) ? reviewerId : null,
      notice_read_at: ['completed', 'rejected'].includes(status) ? null : undefined,
      student_profile_id: enrollmentStudent?.studentId || submission.student_profile_id || undefined,
      student_number: enrollmentStudent?.studentNumber || submission.student_number || undefined,
    })
    .eq('id', submissionId)

  if (error) {
    console.error('Enrollment status update failed:', error)
    return { status: 'error', message: 'Failed to update submission status.' }
  }

  if (paidStudentId) {
    try {
      await approveStudentsWithVerifiedPayments([paidStudentId])
    } catch (approvalError) {
      console.error('Verified payment account approval failed:', approvalError)
      return {
        status: 'error',
        message: 'Payment was verified, but the student pending status could not be cleared. Please retry.',
      }
    }
  }

  revalidatePath('/admin/enrollments')
  revalidatePath('/staff/enrollments')
  revalidatePath('/dashboard')
  revalidatePath('/dashboard/[id]', 'page')
  const affectedStudentIds = [paidStudentId, enrollmentStudent?.studentId].filter((id): id is string => Boolean(id))
  revalidateStudentApprovalViews(affectedStudentIds)

  if (enrollmentStudent) {
    return {
      status: 'success',
      message: enrollmentStudent.emailStatus === 'sent'
        ? `Enrollment approved. Student ${enrollmentStudent.studentNumber} was created and the account email was sent.`
        : `Enrollment approved. Student ${enrollmentStudent.studentNumber} was created. ${enrollmentStudent.emailMessage}`,
    }
  }

  if (paidFeeId) {
    const delivery = await sendPaidTuitionInvoiceEmail(paidFeeId)
    return {
      status: 'success',
      message: delivery.status === 'sent'
        ? 'Payment verified, invoice created and email sent.'
        : delivery.status === 'already_sent'
          ? 'Payment verified. The invoice email was already sent.'
          : delivery.message,
    }
  }
  return { status: 'success', message: status === 'rejected' ? 'Rejected notice saved.' : 'Review status saved.' }
}

export async function markEnrollmentReviewNoticeAsRead(submissionId: string) {
  if (!/^[0-9a-f-]{36}$/i.test(submissionId)) return { error: 'Invalid notice.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, student_number')
    .eq('id', user.id)
    .single()

  if (!profile) return { error: 'Unauthorized' }

  const { data: submission } = await supabaseAdmin
    .from('enrollment_submissions')
    .select('email, student_number, status')
    .eq('id', submissionId)
    .in('status', ['completed', 'rejected'])
    .maybeSingle()

  const ownsNotice = submission
    && (submission.email.toLowerCase() === profile.email.toLowerCase()
      || Boolean(profile.student_number && submission.student_number === profile.student_number))

  if (!ownsNotice) return { error: 'Forbidden' }

  const { error } = await supabaseAdmin
    .from('enrollment_submissions')
    .update({ notice_read_at: new Date().toISOString() })
    .eq('id', submissionId)

  if (error) return { error: 'Unable to mark notice as read.' }
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function checkEnrollmentStatus(
  _previousState: EnrollmentLookupState,
  formData: FormData,
): Promise<EnrollmentLookupState> {
  const referenceCode = cleanText(formData, 'reference_code').toLowerCase()
  const email = cleanText(formData, 'lookup_email').toLowerCase()
  const website = cleanText(formData, 'lookup_website')

  if (website) return { status: 'error', message: 'Submission not found.' }
  if (!/^[a-f0-9]{32}$/.test(referenceCode) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: 'error', message: 'Enter the reference code and email used for the submission.' }
  }

  const { data, error } = await supabaseAdmin
    .from('enrollment_submissions')
    .select('student_name, submission_type, status, payment_month, review_reason, created_at, reviewed_at')
    .eq('tracking_code', referenceCode)
    .ilike('email', email)
    .maybeSingle()

  if (error || !data) {
    return { status: 'error', message: 'Submission not found. Check the reference code and email.' }
  }

  return {
    status: 'success',
    message: 'Submission found.',
    submission: {
      studentName: data.student_name,
      submissionType: data.submission_type,
      status: data.status,
      paymentMonth: data.payment_month,
      reviewReason: data.review_reason,
      submittedAt: data.created_at,
      reviewedAt: data.reviewed_at,
    },
  }
}
