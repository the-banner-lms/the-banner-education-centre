'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { sendPaidTuitionInvoiceEmails } from '@/lib/tuitionInvoiceService'

const allowedReturnPaths = new Set(['/admin/academic-setup', '/staff/academic-setup'])

function returnPath(formData: FormData) {
  const requested = String(formData.get('return_path') || '')
  return allowedReturnPaths.has(requested) ? requested : '/admin/academic-setup'
}

function cleanText(formData: FormData, key: string) {
  return String(formData.get(key) || '').trim().replace(/\s+/g, ' ')
}

function finish(formData: FormData, kind: 'notice' | 'error', message: string): never {
  redirect(`${returnPath(formData)}?${kind}=${encodeURIComponent(message)}`)
}

async function requireAcademicSetupAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['super_admin', 'admin', 'staff'].includes(profile.role)) return null
  return { supabase, userId: user.id }
}

function revalidateAcademicSetup() {
  revalidatePath('/admin/academic-setup')
  revalidatePath('/staff/academic-setup')
}

export async function saveAcademicSettings(formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to manage academic settings.')

  const academicYear = Number(cleanText(formData, 'academic_year'))
  const currentTerm = cleanText(formData, 'current_term')
  const paymentDueDay = Number(cleanText(formData, 'payment_due_day'))
  const receiptPrefix = cleanText(formData, 'receipt_prefix').toUpperCase().replace(/\s+/g, '-')

  if (!Number.isInteger(academicYear) || academicYear < 2000 || academicYear > 2100) {
    finish(formData, 'error', 'Academic year must be between 2000 and 2100.')
  }
  if (currentTerm.length < 2 || currentTerm.length > 40) {
    finish(formData, 'error', 'Current term must be between 2 and 40 characters.')
  }
  if (!Number.isInteger(paymentDueDay) || paymentDueDay < 1 || paymentDueDay > 28) {
    finish(formData, 'error', 'Payment due day must be between 1 and 28.')
  }
  if (!/^[A-Z0-9-]{2,16}$/.test(receiptPrefix)) {
    finish(formData, 'error', 'Receipt prefix must contain 2–16 capital letters, numbers or hyphens.')
  }

  const { error } = await access.supabase
    .from('academic_settings')
    .upsert({
      singleton: true,
      academic_year: academicYear,
      current_term: currentTerm,
      payment_due_day: paymentDueDay,
      receipt_prefix: receiptPrefix,
      updated_by: access.userId,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'singleton' })

  if (error) {
    console.error('Failed to save academic settings:', error)
    finish(formData, 'error', 'Academic settings could not be saved.')
  }

  revalidateAcademicSetup()
  finish(formData, 'notice', 'Academic settings saved.')
}

export async function generateMonthlyInvoices(formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to generate monthly invoices.')

  const monthYear = cleanText(formData, 'month_year')
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(monthYear)) {
    finish(formData, 'error', 'Choose a valid invoice month.')
  }

  const { data: settings, error: settingsError } = await access.supabase
    .from('academic_settings')
    .select('academic_year, current_term')
    .eq('singleton', true)
    .single()
  if (settingsError || !settings) finish(formData, 'error', 'Academic settings could not be loaded.')

  const { data: schoolClasses, error: classError } = await access.supabase
    .from('school_classes')
    .select('code, name, monthly_fee, class_sections(name, monthly_fee, is_active)')
    .eq('academic_year', settings.academic_year)
    .eq('is_active', true)
  if (classError) finish(formData, 'error', 'Class fee plans could not be loaded.')

  const feesByClass = new Map((schoolClasses || []).map(item => [item.code, {
    name: item.name,
    amount: item.code === 'yle' ? 0 : Number(item.monthly_fee),
  }]))
  const yleClass = (schoolClasses || []).find(item => item.code === 'yle')
  const normalizeSection = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '-')
  const yleFees = new Map(
    (yleClass?.class_sections || [])
      .filter(section => section.is_active)
      .map(section => [normalizeSection(section.name), {
        name: section.name,
        amount: Number(section.monthly_fee),
      }]),
  )
  const hasConfiguredFee = [...feesByClass.values()].some(plan => plan.amount > 0)
    || [...yleFees.values()].some(plan => plan.amount > 0)
  if (!hasConfiguredFee) finish(formData, 'error', 'Set a base class fee or YLE section fee greater than 0 first.')

  const { data: students, error: studentError } = await access.supabase
    .from('profiles')
    .select('id, assigned_class, assigned_subclass, yle_monthly_fee')
    .eq('role', 'student')
    .eq('approval_status', 'approved')
  if (studentError) finish(formData, 'error', 'Students could not be loaded.')
  if (!students?.length) finish(formData, 'error', 'No approved students match the configured classes.')

  const studentIds = students.map(student => student.id)
  const { data: existing, error: existingError } = await access.supabase
    .from('monthly_tuition_fees')
    .select('student_id')
    .eq('month_year', monthYear)
    .in('student_id', studentIds)
  if (existingError) finish(formData, 'error', 'Existing invoices could not be checked.')

  const existingStudentIds = new Set((existing || []).map(row => row.student_id))
  const rows = students.flatMap(student => {
    if (!student.assigned_class || existingStudentIds.has(student.id)) return []
    const basePlan = feesByClass.get(student.assigned_class)
    const ylePlan = student.assigned_subclass ? yleFees.get(student.assigned_subclass) : undefined
    const baseAmount = Number(basePlan?.amount || 0)
    const yleAmount = student.assigned_subclass
      ? Number(student.yle_monthly_fee ?? ylePlan?.amount ?? 0)
      : 0
    const totalAmount = baseAmount + yleAmount
    if (totalAmount <= 0) return []

    const breakdown = [
      ...(baseAmount > 0 && basePlan ? [`${basePlan.name} ${baseAmount.toLocaleString('en-US')} MMK`] : []),
      ...(yleAmount > 0 && ylePlan ? [`YLE ${ylePlan.name} ${yleAmount.toLocaleString('en-US')} MMK`] : []),
    ].join(' + ')
    return [{
      student_id: student.id,
      month_year: monthYear,
      status: 'unpaid',
      amount: totalAmount,
      base_amount: baseAmount,
      yle_amount: yleAmount,
      remarks: `${settings.current_term} · ${breakdown}`,
      staff_id: access.userId,
      email_status: 'not_applicable',
    }]
  })

  if (rows.length) {
    const { error } = await access.supabase.from('monthly_tuition_fees').insert(rows)
    if (error) {
      console.error('Failed to generate monthly invoices:', error)
      finish(formData, 'error', 'Monthly invoices could not be generated.')
    }
  }

  revalidateAcademicSetup()
  revalidatePath('/admin/students/fast-entry')
  revalidatePath('/staff/students/fast-entry')
  revalidatePath('/dashboard/[id]', 'page')
  revalidatePath('/dashboard', 'page')
  finish(
    formData,
    'notice',
    rows.length
      ? `${rows.length} monthly invoice${rows.length === 1 ? '' : 's'} generated for ${monthYear}.`
      : `All eligible students already have an invoice for ${monthYear}.`,
  )
}

export async function sendPendingPaidInvoiceEmails(formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to send payment emails.')

  const { data: pending, error } = await access.supabase
    .from('monthly_tuition_fees')
    .select('id')
    .eq('status', 'paid')
    .neq('email_status', 'sent')
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) finish(formData, 'error', 'Pending paid invoices could not be loaded.')
  if (!pending?.length) finish(formData, 'notice', 'No pending paid invoice emails were found.')

  const delivery = await sendPaidTuitionInvoiceEmails(pending.map(row => row.id))
  revalidateAcademicSetup()
  const message = delivery.notConfigured
    ? 'Email provider setup is required before paid invoice emails can be sent.'
    : `${delivery.sent} email${delivery.sent === 1 ? '' : 's'} sent${delivery.failed ? `; ${delivery.failed} failed and can be retried` : ''}.`
  finish(formData, delivery.notConfigured ? 'error' : 'notice', message)
}

export async function resendAllPaidInvoiceEmails(formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to resend payment emails.')

  const { data: paidInvoices, error } = await access.supabase
    .from('monthly_tuition_fees')
    .select('id')
    .eq('status', 'paid')
    .order('created_at', { ascending: true })
    .limit(500)

  if (error) finish(formData, 'error', 'Paid invoices could not be loaded.')
  if (!paidInvoices?.length) finish(formData, 'notice', 'No paid invoice emails were found.')

  const delivery = await sendPaidTuitionInvoiceEmails(
    paidInvoices.map(row => row.id),
    { force: true, resendBatchId: crypto.randomUUID() },
  )
  revalidateAcademicSetup()
  const message = delivery.notConfigured
    ? 'Email provider setup is required before paid invoice emails can be resent.'
    : `${delivery.sent} paid invoice email${delivery.sent === 1 ? '' : 's'} resent${delivery.failed ? `; ${delivery.failed} failed and can be retried` : ''}.`
  finish(formData, delivery.notConfigured ? 'error' : 'notice', message)
}

export async function createAcademicClass(formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to create classes.')

  const academicYear = Number(cleanText(formData, 'academic_year'))
  const name = cleanText(formData, 'name')
  const code = cleanText(formData, 'code').toLowerCase().replace(/\s+/g, '-')
  const monthlyFee = Number(cleanText(formData, 'monthly_fee').replace(/,/g, ''))
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')

  if (!Number.isInteger(academicYear) || academicYear < 2000 || academicYear > 2100) finish(formData, 'error', 'Invalid academic year.')
  if (name.length < 2 || name.length > 80) finish(formData, 'error', 'Class name must be between 2 and 80 characters.')
  if (!/^[a-z0-9-]{2,32}$/.test(code)) finish(formData, 'error', 'Class code must use lowercase letters, numbers or hyphens.')
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0 || monthlyFee > 100000000) finish(formData, 'error', 'Enter a valid monthly fee.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('school_classes').insert({
    academic_year: academicYear,
    name,
    code,
    monthly_fee: Math.round(monthlyFee * 100) / 100,
    sort_order: sortOrder,
    created_by: access.userId,
  })

  if (error) {
    console.error('Failed to create class:', error)
    finish(formData, 'error', error.code === '23505' ? 'That class code already exists for this academic year.' : 'Class could not be created.')
  }

  revalidateAcademicSetup()
  finish(formData, 'notice', `${name} created.`)
}

export async function updateAcademicClass(classId: string, formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to update classes.')
  if (!/^[0-9a-f-]{36}$/i.test(classId)) finish(formData, 'error', 'Invalid class record.')

  const name = cleanText(formData, 'name')
  const code = cleanText(formData, 'code').toLowerCase().replace(/\s+/g, '-')
  const monthlyFee = Number(cleanText(formData, 'monthly_fee').replace(/,/g, ''))
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')
  const isActive = cleanText(formData, 'is_active') === 'true'

  if (name.length < 2 || name.length > 80) finish(formData, 'error', 'Class name must be between 2 and 80 characters.')
  if (!/^[a-z0-9-]{2,32}$/.test(code)) finish(formData, 'error', 'Class code must use lowercase letters, numbers or hyphens.')
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0 || monthlyFee > 100000000) finish(formData, 'error', 'Enter a valid monthly fee.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('school_classes').update({
    name,
    code,
    monthly_fee: Math.round(monthlyFee * 100) / 100,
    sort_order: sortOrder,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }).eq('id', classId)

  if (error) {
    console.error('Failed to update class:', error)
    finish(formData, 'error', error.code === '23505' ? 'That class code already exists for this academic year.' : 'Class could not be updated.')
  }

  revalidateAcademicSetup()
  finish(formData, 'notice', `${name} updated.`)
}

export async function createClassSection(classId: string, formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to create sections.')
  if (!/^[0-9a-f-]{36}$/i.test(classId)) finish(formData, 'error', 'Invalid class record.')

  const name = cleanText(formData, 'name')
  const monthlyFee = Number(cleanText(formData, 'monthly_fee').replace(/,/g, ''))
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')
  if (name.length < 1 || name.length > 60) finish(formData, 'error', 'Section name must be between 1 and 60 characters.')
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0 || monthlyFee > 100000000) finish(formData, 'error', 'Enter a valid section monthly fee.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('class_sections').insert({
    class_id: classId,
    name,
    monthly_fee: Math.round(monthlyFee * 100) / 100,
    sort_order: sortOrder,
    created_by: access.userId,
  })

  if (error) {
    console.error('Failed to create section:', error)
    finish(formData, 'error', error.code === '23505' ? 'That section already exists in this class.' : 'Section could not be created.')
  }

  revalidateAcademicSetup()
  finish(formData, 'notice', `${name} section created.`)
}

export async function updateClassSection(sectionId: string, formData: FormData) {
  const access = await requireAcademicSetupAccess()
  if (!access) finish(formData, 'error', 'You do not have permission to update sections.')
  if (!/^[0-9a-f-]{36}$/i.test(sectionId)) finish(formData, 'error', 'Invalid section record.')

  const name = cleanText(formData, 'name')
  const monthlyFee = Number(cleanText(formData, 'monthly_fee').replace(/,/g, ''))
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')
  const isActive = cleanText(formData, 'is_active') === 'true'
  if (name.length < 1 || name.length > 60) finish(formData, 'error', 'Section name must be between 1 and 60 characters.')
  if (!Number.isFinite(monthlyFee) || monthlyFee < 0 || monthlyFee > 100000000) finish(formData, 'error', 'Enter a valid section monthly fee.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('class_sections').update({
    name,
    monthly_fee: Math.round(monthlyFee * 100) / 100,
    sort_order: sortOrder,
    is_active: isActive,
    updated_at: new Date().toISOString(),
  }).eq('id', sectionId)

  if (error) {
    console.error('Failed to update section:', error)
    finish(formData, 'error', error.code === '23505' ? 'That section already exists in this class.' : 'Section could not be updated.')
  }

  revalidateAcademicSetup()
  finish(formData, 'notice', `${name} section updated.`)
}
