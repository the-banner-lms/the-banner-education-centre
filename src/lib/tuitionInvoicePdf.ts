import PDFDocument from 'pdfkit'
import path from 'node:path'
import { getStudentClassLabel, getYleSubclassLabel } from '@/lib/studentClasses'

export type TuitionInvoiceData = {
  fee: {
    id: string
    invoice_number: string
    month_year: string
    status: 'paid' | 'unpaid' | 'scholar'
    amount: number | string
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

function hasMyanmarText(value: string) {
  return /[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]/.test(value)
}

function writeMixedText(
  doc: PDFKit.PDFDocument,
  value: string,
  x?: number,
  y?: number,
  options: PDFKit.Mixins.TextOptions = {},
) {
  const runs = (value || '-').split(/([\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]+)/).filter(Boolean)
  runs.forEach((run, index) => {
    doc.font(hasMyanmarText(run) ? 'Myanmar' : 'Latin')
    if (index === 0 && typeof x === 'number' && typeof y === 'number') {
      doc.text(run, x, y, { ...options, continued: runs.length > 1 })
    } else {
      doc.text(run, { ...options, continued: index < runs.length - 1 })
    }
  })
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

    const fontDirectory = path.join(process.cwd(), 'node_modules', '@fontsource', 'noto-sans-myanmar', 'files')
    doc.registerFont('Latin', path.join(fontDirectory, 'noto-sans-myanmar-latin-400-normal.woff'))
    doc.registerFont('LatinBold', path.join(fontDirectory, 'noto-sans-myanmar-latin-700-normal.woff'))
    doc.registerFont('Myanmar', path.join(fontDirectory, 'noto-sans-myanmar-myanmar-400-normal.woff'))
    doc.registerFont('MyanmarBold', path.join(fontDirectory, 'noto-sans-myanmar-myanmar-700-normal.woff'))

    const pageWidth = doc.page.width
    const left = 48
    const contentWidth = pageWidth - 96
    const paid = data.fee.status === 'paid'
    const scholar = data.fee.status === 'scholar'

    doc.roundedRect(left, 48, contentWidth, 118, 12).fill('#0d6831')
    doc.fillColor('#ffffff').font('LatinBold').fontSize(21).text(
      'The Banner Education Centre',
      left + 22,
      67,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.font('Latin').fontSize(10).text(
      'Tuition Invoice & Payment Receipt',
      left + 22,
      99,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.moveTo(left + 82, 118).lineTo(left + contentWidth - 82, 118).lineWidth(0.6).strokeColor('#8bc6a3').stroke()
    doc.fillColor('#ffffff').font('LatinBold').fontSize(11).text(
      data.fee.invoice_number,
      left + 22,
      126,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )
    doc.font('Latin').fontSize(8).text(
      `${data.settings.academic_year} · ${data.settings.current_term}`,
      left + 22,
      146,
      { width: contentWidth - 44, align: 'center', lineBreak: false },
    )

    const badgeColor = paid ? '#166534' : scholar ? '#1d4ed8' : '#b91c1c'
    const badgeText = paid ? 'PAID & VERIFIED' : scholar ? 'SCHOLARSHIP' : new Date(data.fee.due_date).getTime() < Date.now() ? 'OVERDUE' : 'UNPAID'
    doc.roundedRect(left, 184, 132, 28, 14).fill(badgeColor)
    doc.fillColor('#ffffff').font('LatinBold').fontSize(10).text(badgeText, left, 193, { width: 132, align: 'center' })

    doc.fillColor('#64748b').font('LatinBold').fontSize(9).text('STUDENT', left, 238)
    doc.fillColor('#0f172a').fontSize(15)
    writeMixedText(doc, data.student.full_name || 'Student', left, 256, { width: 250 })
    doc.fillColor('#475569').font('Latin').fontSize(10).text(`Student ID: ${data.student.student_number || 'Pending assignment'}`, left, 286)
    doc.text(data.student.email, left, 303, { width: 250 })
    const classLabel = data.student.assigned_class ? getStudentClassLabel(data.student.assigned_class) : 'Not assigned'
    const subclassLabel = data.student.assigned_subclass
      ? ` · YLE ${getYleSubclassLabel(data.student.assigned_subclass)}`
      : ''
    doc.text(`Class: ${classLabel}${subclassLabel}`, left, 320, { width: 250 })

    const detailsX = left + 300
    doc.fillColor('#64748b').font('LatinBold').fontSize(9).text('INVOICE DETAILS', detailsX, 238)
    doc.fillColor('#334155').font('Latin').fontSize(10)
    doc.text(`Invoice date: ${formatDate(data.fee.created_at)}`, detailsX, 260)
    doc.text(`Payment month: ${data.fee.month_year}`, detailsX, 278)
    doc.text(`Due date: ${formatDate(data.fee.due_date)}`, detailsX, 296)
    doc.text(`Verified date: ${formatDate(data.fee.verified_at || data.fee.paid_at)}`, detailsX, 314)

    const tableTop = 364
    doc.roundedRect(left, tableTop, contentWidth, 42, 8).fill('#f1f5f9')
    doc.fillColor('#475569').font('LatinBold').fontSize(9)
    doc.text('DESCRIPTION', left + 16, tableTop + 16)
    doc.text('STATUS', left + 302, tableTop + 16, { width: 80 })
    doc.text('AMOUNT', left + 390, tableTop + 16, { width: contentWidth - 406, align: 'right' })

    const rowTop = tableTop + 42
    doc.rect(left, rowTop, contentWidth, 70).strokeColor('#e2e8f0').stroke()
    doc.fillColor('#0f172a').font('LatinBold').fontSize(11).text(`${data.fee.month_year} Monthly Tuition`, left + 16, rowTop + 18, { width: 260 })
    doc.fillColor('#64748b').font('Latin').fontSize(9).text(`${classLabel}${subclassLabel}`, left + 16, rowTop + 39, { width: 260 })
    doc.fillColor(badgeColor).font('LatinBold').fontSize(10).text(data.fee.status.toUpperCase(), left + 302, rowTop + 27, { width: 80 })
    doc.fillColor('#0f172a').font('LatinBold').fontSize(12).text(formatAmount(data.fee.amount), left + 390, rowTop + 25, { width: contentWidth - 406, align: 'right' })

    const totalTop = rowTop + 92
    doc.fillColor('#475569').font('LatinBold').fontSize(11).text(paid ? 'TOTAL PAID' : scholar ? 'SCHOLARSHIP VALUE' : 'AMOUNT DUE', left + 210, totalTop, { width: 120, align: 'right', lineBreak: false })
    doc.fillColor('#0d6831').fontSize(16).text(formatAmount(data.fee.amount), left + 344, totalTop - 3, { width: contentWidth - 344, align: 'right', lineBreak: false })

    if (data.fee.remarks) {
      doc.fillColor('#64748b').font('LatinBold').fontSize(9).text('REMARK', left, totalTop + 54)
      doc.fillColor('#334155').fontSize(10)
      writeMixedText(doc, data.fee.remarks, left, totalTop + 72, { width: contentWidth, lineGap: 3 })
    }

    doc.roundedRect(left, 670, contentWidth, 70, 10).fill('#f8fafc')
    doc.fillColor('#334155').font('LatinBold').fontSize(10).text(
      paid ? 'Payment confirmed. Thank you.' : scholar ? 'This student is recorded as a scholarship student.' : `Please pay by ${formatDate(data.fee.due_date)}.`,
      left + 18,
      691,
      { width: contentWidth - 36, align: 'center' },
    )
    doc.fillColor('#64748b').font('Latin').fontSize(8).text('This computer-generated document does not require a signature.', left + 18, 716, { width: contentWidth - 36, align: 'center' })

    doc.fillColor('#94a3b8').font('Latin').fontSize(8).text(
      `Generated ${formatDate(new Date().toISOString())} · The Banner Education Centre`,
      left,
      758,
      { width: contentWidth, align: 'center' },
    )
    doc.end()
  })
}
