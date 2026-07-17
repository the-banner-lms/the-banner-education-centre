'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')
  if (name.length < 1 || name.length > 60) finish(formData, 'error', 'Section name must be between 1 and 60 characters.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('class_sections').insert({
    class_id: classId,
    name,
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
  const sortOrder = Number(cleanText(formData, 'sort_order') || '0')
  const isActive = cleanText(formData, 'is_active') === 'true'
  if (name.length < 1 || name.length > 60) finish(formData, 'error', 'Section name must be between 1 and 60 characters.')
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 10000) finish(formData, 'error', 'Enter a valid display order.')

  const { error } = await access.supabase.from('class_sections').update({
    name,
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
