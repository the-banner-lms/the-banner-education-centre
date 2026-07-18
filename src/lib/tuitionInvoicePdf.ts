import PDFDocument from 'pdfkit'
import path from 'node:path'
import { getStudentClassLabel, getYleSubclassLabel } from '@/lib/studentClasses'
import { writeMixedPdfText } from '@/lib/pdfMixedText'

type TuitionStatus = 'paid' | 'unpaid' | 'scholar'

type InvoiceLine = {
  title: string
  detail: string
  amount: number
  status: TuitionStatus
}

export type TuitionInvoiceData = {
  fee: {
    id: string
    invoice_number: string
    month_year: string
    status: 'paid' | 'unpaid' | 'scholar'
    base_status: 'paid' | 'unpaid' | 'scholar' | null
    yle_status: 'paid' | 'unpaid' | 'scholar' | null
    amount: number | string
    base_amount: number | string
    yle_amount: number | string
    remarks: string | null
    due_date: string
    paid_at: string | null
    verified_at: string | null
    created_at: string
  }
  student: {
    full_name: string | null
    email: string
    student_number: string | null
    assigned_class: string | null
    assigned_subclass: string | null
    address: string | null
  }
  settings: {
    academic_year: number
    current_term: string
  }
}

function formatDate(value: string | null) {
  if (!value) return '-'
  const date = new Date(value.length === 10 ? `${value}T00:00:00Z` : value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    timeZone: 'Asia/Yangon',
  }).format(date)
}

function formatAmount(value: number | string) {
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value || 0))} MMK`
}

export function buildTuitionInvoicePdf(data: TuitionInvoiceData) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 48, right: 48, bottom: 48, left: 48 },
      info: {
        Title: `${data.fee.invoice_number} - Tuition Invoice`,
        Author: 'The Banner Education Centre',
      },
    })
    const chunks: Buffer[] = []
    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    void (async () => {
    const fontDirectory = path.join(process.cwd(), 'src', 'assets', 'fonts')
    const regularFont = path.join(fontDirectory, 'Z06-Walone-Regular.ttf')
    const boldFont = path.join(fontDirectory, 'Z06-Walone-Bold.ttf')
    doc.registerFont('Myanmar', regularFont)
    doc.registerFont('MyanmarBold', boldFont)

    const pageWidth = doc.page.width
    const left = 48
    const contentWidth = pageWidth - 96
    const classLabel = data.student.assigned_class ? getStudentClassLabel(data.student.assigned_class) : 'Not assigned'
    const subclassLabel = data.student.assigned_subclass
      ? ` · YLE ${getYleSubclassLabel(data.student.assigned_subclass)}`
      : ''
    const baseAmount = Number(data.fee.base_amount || 0)
    const yleAmount = Number(data.fee.yle_amount || 0)
    const hasYle = Boolean(data.student.assigned_subclass)
    const isYleStandalone = data.student.assigned_class === 'yle'
    const invoiceLines: InvoiceLine[] = isYleStandalone
      ? [{
        title: `YLE ${getYleSubclassLabel(data.student.assigned_subclass)} Tuition`,
        detail: 'YLE standalone tuition',
        amount: yleAmount || Number(data.fee.amount),
        status: data.fee.yle_status || data.fee.status,
      }]
      : hasYle
        ? [
          {
            title: `${classLabel} Tuition`,
            detail: 'Base class tuition',
            amount: baseAmount,
            status: data.fee.base_status || data.fee.status,
          },
          {
            title: `YLE ${getYleSubclassLabel(data.student.assigned_subclass)} Tuition`,
            detail: 'YLE dual-class tuition',
            amount: yleAmount,
            status: data.fee.yle_status || data.fee.status,
          },
        ]
        : [{
          title: `${classLabel} Tuition`,
          detail: `${data.fee.month_year} monthly tuition`,
          amount: Number(data.fee.amount),
          status: data.fee.base_status || data.fee.status,
        }]
    const paidValue = invoiceLines.reduce((sum, line) => sum + (line.status === 'paid' ? line.amount : 0), 0)
    const scholarshipValue = invoiceLines.reduce((sum, line) => sum + (line.status === 'scholar' ? line.amount : 0), 0)
    const amountDue = invoiceLines.reduce((sum, line) => sum + (line.status === 'unpaid' ? line.amount : 0), 0)
    const hasPaid = invoiceLines.some(line => line.status === 'paid')
    const hasScholarship = invoiceLines.some(line => line.status === 'scholar')
    const hasUnpaid = invoiceLines.some(line => line.status === 'unpaid')

    doc.roundedRect(left, 48, contentWidth, 118, 12).fill('#0d6831')
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(21).text(
      'The Banner Education Centre',
      left + 22,
      67,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.font('Helvetica').fontSize(10).text(
      'Tuition Invoice & Payment Receipt',
      left + 22,
      99,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.moveTo(left + 82, 118).lineTo(left + contentWidth - 82, 118).lineWidth(0.6).strokeColor('#8bc6a3').stroke()
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(11).text(
      data.fee.invoice_number,
      left + 22,
      126,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.font('Helvetica').fontSize(8).text(
      `${data.settings.academic_year} · ${data.settings.current_term}`,
      left + 22,
      146,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )

    const overdue = hasUnpaid && new Date(data.fee.due_date).getTime() < Date.now()
    const badgeColor = hasUnpaid ? '#b91c1c' : hasScholarship ? '#1d4ed8' : '#166534'
    const badgeText = hasUnpaid
      ? hasScholarship ? `${overdue ? 'OVERDUE' : 'UNPAID'} + SCHOLARSHIP` : overdue ? 'OVERDUE' : 'UNPAID'
      : hasScholarship && hasPaid ? 'PAID + SCHOLARSHIP' : hasScholarship ? 'SCHOLARSHIP' : 'PAID & VERIFIED'
    const badgeWidth = badgeText.length > 16 ? 176 : 132
    doc.roundedRect(left, 184, badgeWidth, 28, 14).fill(badgeColor)
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(badgeText.length > 16 ? 8.5 : 10).text(badgeText, left, 193, { width: badgeWidth, align: 'center' })

    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('STUDENT', left, 238)
    doc.fillColor('#0f172a').fontSize(15)
    await writeMixedPdfText(doc, data.student.full_name || 'Student', left, 256, { width: 250 })
    doc.fillColor('#475569').font('Helvetica').fontSize(10).text(`Student ID: ${data.student.student_number || 'Pending assignment'}`, left, 286)
    doc.text(data.student.email, left, 303, { width: 250 })
    doc.text(`Class: ${classLabel}${subclassLabel}`, left, 320, { width: 250 })

    const detailsX = left + 300
    doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('INVOICE DETAILS', detailsX, 238)
    doc.fillColor('#334155').font('Helvetica').fontSize(10)
    doc.text(`Invoice date: ${formatDate(data.fee.created_at)}`, detailsX, 260)
    doc.text(`Payment month: ${data.fee.month_year}`, detailsX, 278)
    doc.text(`Due date: ${formatDate(data.fee.due_date)}`, detailsX, 296)
    doc.text(`Verified date: ${formatDate(data.fee.verified_at || data.fee.paid_at)}`, detailsX, 314)

    const tableTop = 364
    doc.roundedRect(left, tableTop, contentWidth, 42, 8).fill('#f1f5f9')
    doc.fillColor('#475569').font('Helvetica-Bold').fontSize(9)
    doc.text('DESCRIPTION', left + 16, tableTop + 16)
    doc.text('STATUS', left + 302, tableTop + 16, { width: 80 })
    doc.text('AMOUNT', left + 390, tableTop + 16, { width: contentWidth - 406, align: 'right' })

    const rowTop = tableTop + 42
    const rowHeight = 58

    invoiceLines.forEach((line, index) => {
      const lineTop = rowTop + (index * rowHeight)
      doc.rect(left, lineTop, contentWidth, rowHeight).strokeColor('#e2e8f0').stroke()
      doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text(line.title, left + 16, lineTop + 12, { width: 270 })
      const lineDetail = line.status === 'scholar' ? `${line.detail} - fee waived` : line.detail
      doc.fillColor('#64748b').font('Helvetica').fontSize(9).text(lineDetail, left + 16, lineTop + 33, { width: 270 })
      const lineColor = line.status === 'paid' ? '#166534' : line.status === 'scholar' ? '#1d4ed8' : '#b91c1c'
      const lineStatus = line.status === 'scholar' ? 'SCHOLARSHIP' : line.status.toUpperCase()
      doc.fillColor(lineColor).font('Helvetica-Bold').fontSize(line.status === 'scholar' ? 8.5 : 10).text(lineStatus, left + 302, lineTop + 22, { width: 80 })
      doc.fillColor(line.status === 'scholar' ? '#1d4ed8' : '#0f172a').font('Helvetica-Bold').fontSize(12).text(formatAmount(line.amount), left + 390, lineTop + 20, { width: contentWidth - 406, align: 'right' })
    })

    const totalTop = rowTop + (invoiceLines.length * rowHeight) + 22
    const summaryRows = [
      ...(hasPaid ? [{ label: 'TOTAL PAID', value: paidValue, color: '#0d6831' }] : []),
      ...(hasScholarship ? [{ label: 'SCHOLARSHIP VALUE', value: scholarshipValue, color: '#1d4ed8' }] : []),
      ...(hasUnpaid ? [{ label: 'AMOUNT DUE', value: amountDue, color: '#b91c1c' }] : []),
    ]
    summaryRows.forEach((summary, index) => {
      const y = totalTop + (index * 21)
      doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text(summary.label, left + 180, y, { width: 150, align: 'right', lineBreak: false })
      doc.fillColor(summary.color).fontSize(14).text(formatAmount(summary.value), left + 344, y - 2, { width: contentWidth - 344, align: 'right', lineBreak: false })
    })
    const summaryBottom = totalTop + (summaryRows.length * 21)

    if (data.fee.remarks) {
      doc.fillColor('#64748b').font('Helvetica-Bold').fontSize(9).text('REMARK', left, summaryBottom + 24)
      doc.fillColor('#334155').fontSize(10)
      await writeMixedPdfText(doc, data.fee.remarks, left, summaryBottom + 42, { width: contentWidth, lineGap: 3 })
    }

    doc.roundedRect(left, 670, contentWidth, 70, 10).fill('#f8fafc')
    doc.fillColor('#334155').font('Helvetica-Bold').fontSize(10).text(
      hasUnpaid
        ? `Please pay the outstanding ${formatAmount(amountDue)} by ${formatDate(data.fee.due_date)}.`
        : hasScholarship && hasPaid
          ? 'Payment confirmed. Scholarship applied to the eligible tuition line.'
          : hasScholarship
            ? 'This tuition is fully covered by scholarship.'
            : 'Payment confirmed. Thank you.',
      left + 18,
      691,
      { width: contentWidth - 36, align: 'center' },
    )
    doc.fillColor('#64748b').font('Helvetica').fontSize(8).text('This computer-generated document does not require a signature.', left + 18, 716, { width: contentWidth - 36, align: 'center' })

    doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(
      `Generated ${formatDate(new Date().toISOString())} · The Banner Education Centre`,
      left,
      758,
      { width: contentWidth, align: 'center' },
    )
    doc.end()
    })().catch(reject)
  })
}
