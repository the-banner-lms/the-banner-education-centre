'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { isStudentClass, isYleSubclass } from '@/lib/studentClasses'

export type EnrollmentFormState = {
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

  if (profile?.role !== 'admin' && profile?.role !== 'staff') {
    throw new Error('Unauthorized')
  }
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
  if (!(paymentSlip instanceof File) || paymentSlip.size === 0) {
    return { status: 'error', message: 'Please attach the payment slip.' }
  }
  if (paymentSlip.size > 4 * 1024 * 1024 || !allowedFileTypes[paymentSlip.type]) {
    return { status: 'error', message: 'Payment slip must be a JPG, PNG, WebP or PDF file under 4 MB.' }
  }

  const extension = allowedFileTypes[paymentSlip.type]
  const paymentSlipPath = `${submissionType}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`
  const { error: uploadError } = await supabaseAdmin.storage
    .from('enrollment-slips')
    .upload(paymentSlipPath, paymentSlip, {
      contentType: paymentSlip.type,
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) {
    console.error('Enrollment payment slip upload failed:', uploadError)
    return { status: 'error', message: 'Payment slip upload failed. Please try again.' }
  }

  const { error: insertError } = await supabaseAdmin
    .from('enrollment_submissions')
    .insert({
      submission_type: submissionType,
      assigned_class: assignedClass,
      assigned_subclass: assignedClass === 'yle' ? requestedSubclass : null,
      student_name: studentName,
      email,
      contact_number: contactNumber,
      viber_number: viberNumber || null,
      address: submissionType === 'new_enrollment' ? address || null : null,
      student_number: submissionType === 'monthly_payment' ? studentNumber || null : null,
      payment_month: submissionType === 'monthly_payment' ? paymentMonth : null,
      note: note || null,
      payment_slip_path: paymentSlipPath,
    })

  if (insertError) {
    console.error('Enrollment submission failed:', insertError)
    await supabaseAdmin.storage.from('enrollment-slips').remove([paymentSlipPath])
    return { status: 'error', message: 'Submission failed. Please try again.' }
  }

  revalidatePath('/admin/enrollments')
  revalidatePath('/staff/enrollments')

  return {
    status: 'success',
    message: submissionType === 'new_enrollment'
      ? 'Enrollment submitted successfully. Our team will contact you soon.'
      : 'Monthly payment slip submitted successfully.',
  }
}

export async function updateEnrollmentStatus(submissionId: string, formData: FormData) {
  await verifyStaffAccess()
  const status = cleanText(formData, 'status')
  if (!['pending', 'contacted', 'completed', 'rejected'].includes(status)) {
    throw new Error('Invalid status')
  }

  const { error } = await supabaseAdmin
    .from('enrollment_submissions')
    .update({ status })
    .eq('id', submissionId)

  if (error) {
    console.error('Enrollment status update failed:', error)
    throw new Error('Failed to update submission status.')
  }

  revalidatePath('/admin/enrollments')
  revalidatePath('/staff/enrollments')
}
