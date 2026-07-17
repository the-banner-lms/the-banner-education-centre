import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/utils/supabase/admin'
import { buildTuitionInvoicePdf } from '@/lib/tuitionInvoicePdf'
import { getTuitionInvoiceData } from '@/lib/tuitionInvoiceService'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(_request: Request, context: RouteContext<'/api/tuition-invoice/[id]'>) {
  const { id } = await context.params
  if (!/^[0-9a-f-]{36}$/i.test(id)) return new Response('Invalid invoice.', { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('Unauthorized.', { status: 401 })

  const [{ data: currentProfile }, { data: fee }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
    supabaseAdmin.from('monthly_tuition_fees').select('student_id').eq('id', id).maybeSingle(),
  ])
  if (!currentProfile || !fee) return new Response('Invoice not found.', { status: 404 })

  const authorized = fee.student_id === user.id || ['super_admin', 'admin', 'staff'].includes(currentProfile.role)
  if (!authorized) return new Response('Forbidden.', { status: 403 })

  const invoice = await getTuitionInvoiceData(id)
  if (!invoice) return new Response('Invoice not found.', { status: 404 })

  try {
    const pdf = await buildTuitionInvoicePdf(invoice)
    const safeInvoiceNumber = invoice.fee.invoice_number.replace(/[^A-Z0-9-]/gi, '')
    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeInvoiceNumber}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Unable to generate tuition invoice PDF:', error)
    return new Response('Unable to generate invoice PDF.', { status: 500 })
  }
}
