import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AcademicClass, AcademicSettings } from '@/components/academic/AcademicSetupPanel'

export const DEFAULT_ACADEMIC_SETTINGS: AcademicSettings = {
  academic_year: 2026,
  current_term: '2nd Term',
  payment_due_day: 5,
  receipt_prefix: 'TBEC',
}

export async function getAcademicSetup(supabase: SupabaseClient) {
  const { data: settingsData, error: settingsError } = await supabase
    .from('academic_settings')
    .select('academic_year, current_term, payment_due_day, receipt_prefix')
    .eq('singleton', true)
    .maybeSingle()

  if (settingsError) console.error('Failed to load academic settings:', settingsError)
  const settings = (settingsData || DEFAULT_ACADEMIC_SETTINGS) as AcademicSettings

  const { data: classesData, error: classesError } = await supabase
    .from('school_classes')
    .select('id, academic_year, code, name, monthly_fee, sort_order, is_active, class_sections(id, name, sort_order, is_active)')
    .eq('academic_year', settings.academic_year)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true })

  if (classesError) console.error('Failed to load school classes:', classesError)

  return {
    settings,
    classes: (classesData || []) as AcademicClass[],
    error: settingsError || classesError ? 'Academic setup data could not be loaded.' : null,
  }
}
