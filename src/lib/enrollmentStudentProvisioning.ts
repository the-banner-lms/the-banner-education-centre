import 'server-only'

import { supabaseAdmin } from '@/utils/supabase/admin'

type EnrollmentStudentInput = {
  submissionId: string
  fullName: string
  email: string
  assignedClass: string
  assignedSubclass: string | null
  address: string | null
}

export type EnrollmentStudentResult = {
  studentId: string
  studentNumber: string
  emailStatus: 'sent' | 'failed'
  emailMessage: string
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

async function createStudentNumber(assignedClass: string) {
  const { data, error } = await supabaseAdmin.rpc('next_student_number', {
    p_class_code: assignedClass,
  })

  if (error || typeof data !== 'string') {
    console.error('Enrollment student ID generation failed:', error)
    throw new Error('A unique Student ID could not be generated.')
  }
  return data
}

async function sendStudentAccessEmail(input: {
  submissionId: string
  fullName: string
  email: string
  studentNumber: string
  actionLink: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PAYMENT_EMAIL_FROM
  if (!apiKey || !from) {
    return { status: 'failed' as const, message: 'Student created, but enrollment email is not configured.' }
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': `student-enrollment-${input.submissionId}-${crypto.randomUUID()}`,
      },
      body: JSON.stringify({
        from,
        to: [input.email],
        reply_to: process.env.PAYMENT_EMAIL_REPLY_TO || undefined,
        subject: `Enrollment approved · ${input.studentNumber}`,
        html: `
          <div style="font-family:Arial,sans-serif;max-width:620px;margin:auto;color:#16231a">
            <div style="background:#0d6831;color:white;padding:24px;border-radius:12px 12px 0 0">
              <h1 style="margin:0;font-size:22px">The Banner Education Centre</h1>
              <p style="margin:8px 0 0">Student enrollment approved</p>
            </div>
            <div style="border:1px solid #dbe5dd;border-top:0;padding:24px;border-radius:0 0 12px 12px">
              <p>Dear ${escapeHtml(input.fullName)},</p>
              <p>Your enrollment has been approved and your student account is ready.</p>
              <p><strong>Student ID:</strong> ${escapeHtml(input.studentNumber)}</p>
              <p style="margin:28px 0">
                <a href="${escapeHtml(input.actionLink)}" style="display:inline-block;background:#0d6831;color:white;text-decoration:none;font-weight:bold;padding:13px 22px;border-radius:999px">Set password &amp; open dashboard</a>
              </p>
              <p style="font-size:13px;color:#59645d">For your security, use the button above to set a private password. If you did not submit this enrollment, contact the school.</p>
              <p style="margin-top:28px">Thank you,<br><strong>The Banner Education Centre</strong></p>
            </div>
          </div>`,
      }),
      signal: AbortSignal.timeout(15000),
    })

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 350)
      throw new Error(`Email provider rejected the request (${response.status}): ${detail}`)
    }
    return { status: 'sent' as const, message: 'Student account invitation email sent.' }
  } catch (error) {
    const detail = error instanceof Error ? error.message.slice(0, 500) : 'Unknown email delivery error.'
    console.error('Enrollment account email failed:', detail)
    return { status: 'failed' as const, message: 'Student created, but the account invitation email failed and should be retried.' }
  }
}

export async function provisionStudentFromEnrollment(input: EnrollmentStudentInput): Promise<EnrollmentStudentResult> {
  const normalizedEmail = input.email.trim().toLowerCase()
  const { data: existingProfile, error: profileLookupError } = await supabaseAdmin
    .from('profiles')
    .select('id, role, student_number')
    .ilike('email', normalizedEmail)
    .maybeSingle()

  if (profileLookupError) {
    console.error('Enrollment profile lookup failed:', profileLookupError)
    throw new Error('The enrollment email could not be checked against existing accounts.')
  }
  if (existingProfile && existingProfile.role !== 'student') {
    throw new Error('This email already belongs to a non-student account and cannot be converted automatically.')
  }

  const redirectTo = `${process.env.STUDENT_INVITE_SITE_URL || 'https://the-banner-education-centre.vercel.app'}/auth/set-password`
  const { data: linkData, error: linkError } = existingProfile
    ? await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: normalizedEmail,
      options: { redirectTo },
    })
    : await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: normalizedEmail,
      options: {
        redirectTo,
        data: {
          full_name: input.fullName,
          assigned_class: input.assignedClass,
          assigned_subclass: input.assignedSubclass,
          enrollment_submission_id: input.submissionId,
        },
      },
    })

  if (linkError || !linkData.user || !linkData.properties?.action_link) {
    console.error('Student account link generation failed:', linkError)
    throw new Error('The student login invitation could not be created.')
  }

  const createdNewAuthUser = !existingProfile
  const studentId = existingProfile?.id || linkData.user.id
  let studentNumber = existingProfile?.student_number || null
  try {
    if (!studentNumber) studentNumber = await createStudentNumber(input.assignedClass)

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: studentId,
        email: normalizedEmail,
        full_name: input.fullName,
        assigned_class: input.assignedClass,
        assigned_subclass: input.assignedClass === 'pre-kg' ? null : input.assignedSubclass,
        address: input.address,
        student_number: studentNumber,
        role: 'student',
        approval_status: 'approved',
      }, { onConflict: 'id' })

    if (profileError) {
      console.error('Enrollment student profile creation failed:', profileError)
      throw new Error('The student account was invited, but its profile could not be created.')
    }
  } catch (error) {
    if (createdNewAuthUser) await supabaseAdmin.auth.admin.deleteUser(studentId)
    throw error
  }

  const emailDelivery = await sendStudentAccessEmail({
    submissionId: input.submissionId,
    fullName: input.fullName,
    email: normalizedEmail,
    studentNumber,
    actionLink: linkData.properties.action_link,
  })

  return {
    studentId,
    studentNumber,
    emailStatus: emailDelivery.status,
    emailMessage: emailDelivery.message,
  }
}
