import type { Metadata } from 'next'
import AcademicSetupPanel from '@/components/academic/AcademicSetupPanel'
import { getAcademicSetup } from '@/lib/academicSetup'
import { createClient } from '@/utils/supabase/server'

export const metadata: Metadata = { title: 'Academic Setup | Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminAcademicSetupPage(props: {
  searchParams: Promise<{ notice?: string; error?: string }>
}) {
  const [supabase, searchParams] = await Promise.all([createClient(), props.searchParams])
  const setup = await getAcademicSetup(supabase)

  return (
    <AcademicSetupPanel
      settings={setup.settings}
      classes={setup.classes}
      returnPath="/admin/academic-setup"
      notice={searchParams.notice}
      error={searchParams.error || setup.error || undefined}
      emailConfigured={Boolean(process.env.RESEND_API_KEY && process.env.PAYMENT_EMAIL_FROM)}
    />
  )
}
