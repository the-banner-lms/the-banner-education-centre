import { createClient } from '@/utils/supabase/server'
import { canViewDashboard } from '@/utils/supabase/queries'
import PDFDocument from 'pdfkit'
import path from 'node:path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'off' | null

interface PerformanceRecord {
  week_start_date: string
  burmese_score: string | null
  english_score: string | null
  math_score: string | null
  science_score: string | null
  sports_score: string | null
  art_score: string | null
  social_score: string | null
  health_score: string | null
  teamwork_score: string | null
  discipline_score: string | null
  remarks: string | null
}

interface TuitionFeeRecord {
  month_year: string
  status: string
  remarks: string | null
  created_at: string
}

interface AttendanceRecord {
  date: string
  morning_status: AttendanceStatus
  afternoon_status: AttendanceStatus
}

const pageMargin = 42
const contentWidth = 595.28 - (pageMargin * 2)
const bottomLimit = 800
const maximumAvatarBytes = 5 * 1024 * 1024

function getMyanmarWeekStart() {
  const now = new Date()
  const myanmarNow = new Date(now.getTime() + (390 * 60 * 1000))
  const day = myanmarNow.getUTCDay()
  const diff = day === 0 ? -6 : 1 - day
  myanmarNow.setUTCDate(myanmarNow.getUTCDate() + diff)
  return myanmarNow.toISOString().slice(0, 10)
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day + days))
  return date.toISOString().slice(0, 10)
}

function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.slice(0, 10).split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year.slice(-2)}`
}

function hasMyanmarText(value: string) {
  return /[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]/.test(value)
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase()
  return normalized === 'localhost'
    || normalized === '::1'
    || normalized.endsWith('.local')
    || /^127\./.test(normalized)
    || /^10\./.test(normalized)
    || /^192\.168\./.test(normalized)
    || /^169\.254\./.test(normalized)
    || /^172\.(1[6-9]|2\d|3[01])\./.test(normalized)
}

async function loadAvatarImage(avatarUrl: string | null) {
  if (!avatarUrl) return null

  try {
    const url = new URL(avatarUrl)
    if (url.protocol !== 'https:' || isPrivateHostname(url.hostname)) {
      return null
    }

    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    if (!response.ok) return null

    const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
    if (contentType !== 'image/jpeg' && contentType !== 'image/png') {
      return null
    }

    const contentLength = Number(response.headers.get('content-length') || 0)
    if (contentLength > maximumAvatarBytes) return null

    const image = Buffer.from(await response.arrayBuffer())
    return image.length > 0 && image.length <= maximumAvatarBytes ? image : null
  } catch {
    return null
  }
}

function getProfileInitials(fullName: string | null) {
  const latinWords = (fullName || '').match(/[A-Za-z]+/g) || []
  if (!latinWords.length) return 'S'
  return latinWords.slice(0, 2).map((word) => word[0].toUpperCase()).join('')
}

function drawCenteredProfilePicture(
  doc: PDFKit.PDFDocument,
  fullName: string | null,
  avatarImage?: Buffer | null,
) {
  const size = 64
  const x = (doc.page.width - size) / 2
  const y = pageMargin
  const centerX = x + (size / 2)
  const centerY = y + (size / 2)

  if (avatarImage) {
    try {
      doc.save()
      doc.circle(centerX, centerY, size / 2).clip()
      doc.image(avatarImage, x, y, {
        cover: [size, size],
        align: 'center',
        valign: 'center',
      })
      doc.restore()
    } catch {
      doc.restore()
      doc.circle(centerX, centerY, size / 2).fill('#e0e7ff')
      doc.fillColor('#3730a3').font('LatinBold').fontSize(19).text(
        getProfileInitials(fullName),
        x,
        y + 21,
        { width: size, align: 'center', lineBreak: false },
      )
    }
  } else {
    doc.circle(centerX, centerY, size / 2).fill('#e0e7ff')
    doc.fillColor('#3730a3').font('LatinBold').fontSize(19).text(
      getProfileInitials(fullName),
      x,
      y + 21,
      { width: size, align: 'center', lineBreak: false },
    )
  }

  doc.circle(centerX, centerY, size / 2).lineWidth(2).strokeColor('#c7d2fe').stroke()
  doc.y = y + size + 14
}

function writeMixedText(
  doc: PDFKit.PDFDocument,
  value: string,
  options: PDFKit.Mixins.TextOptions = {},
) {
  const text = value || '-'
  const runs = text.split(/([\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]+)/).filter(Boolean)

  runs.forEach((run, index) => {
    doc.font(hasMyanmarText(run) ? 'Myanmar' : 'Latin')
    doc.text(run, {
      ...options,
      continued: index < runs.length - 1,
    })
  })
}

function ensureSpace(doc: PDFKit.PDFDocument, height: number) {
  if (doc.y + height > bottomLimit) {
    doc.addPage()
  }
}

function sectionHeading(doc: PDFKit.PDFDocument, title: string) {
  ensureSpace(doc, 44)
  doc.moveDown(0.7)
  const y = doc.y
  doc.roundedRect(pageMargin, y, contentWidth, 28, 5).fill('#eef2ff')
  doc.fillColor('#312e81').font('LatinBold').fontSize(13).text(title, pageMargin + 10, y + 7)
  doc.y = y + 34
}

function row(
  doc: PDFKit.PDFDocument,
  columns: Array<{ text: string; width: number; myanmar?: boolean }>,
  shaded = false,
) {
  const rowHeight = 24
  ensureSpace(doc, rowHeight + 2)
  const y = doc.y

  if (shaded) {
    doc.rect(pageMargin, y, contentWidth, rowHeight).fill('#f8fafc')
  }
  doc.rect(pageMargin, y, contentWidth, rowHeight).strokeColor('#e2e8f0').stroke()

  let x = pageMargin
  columns.forEach((column, index) => {
    if (index > 0) {
      doc.moveTo(x, y).lineTo(x, y + rowHeight).strokeColor('#e2e8f0').stroke()
    }
    doc.fillColor('#334155').fontSize(9)
    if (column.myanmar) {
      doc.x = x + 6
      doc.y = y + 7
      writeMixedText(doc, column.text, { width: column.width - 12, height: 18 })
    } else {
      doc.font('Latin').text(column.text || '-', x + 6, y + 7, {
        width: column.width - 12,
        height: 14,
        ellipsis: true,
      })
    }
    x += column.width
  })
  doc.y = y + rowHeight
}

export function buildStudentReportPdf(options: {
  profile: { full_name: string | null; email: string | null; role: string; student_number: string | null }
  weekStart: string
  performances: PerformanceRecord[]
  tuitionFees: TuitionFeeRecord[]
  attendance: AttendanceRecord[]
  avatarImage?: Buffer | null
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: pageMargin, right: pageMargin, bottom: pageMargin, left: pageMargin },
      bufferPages: true,
      info: {
        Title: `${options.profile.full_name || 'Student'} - Weekly Report`,
        Author: 'The Banner Education Centre',
      },
    })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const fontDirectory = path.join(
      process.cwd(),
      'node_modules',
      '@fontsource',
      'noto-sans-myanmar',
      'files',
    )
    doc.registerFont('Latin', path.join(fontDirectory, 'noto-sans-myanmar-latin-400-normal.woff'))
    doc.registerFont('LatinBold', path.join(fontDirectory, 'noto-sans-myanmar-latin-700-normal.woff'))
    doc.registerFont('Myanmar', path.join(fontDirectory, 'noto-sans-myanmar-myanmar-400-normal.woff'))
    doc.registerFont('MyanmarBold', path.join(fontDirectory, 'noto-sans-myanmar-myanmar-700-normal.woff'))

    drawCenteredProfilePicture(doc, options.profile.full_name, options.avatarImage)
    doc.fillColor('#312e81').font('LatinBold').fontSize(20).text('The Banner Education Centre', {
      align: 'center',
    })
    doc.moveDown(0.2).fillColor('#64748b').font('Latin').fontSize(12).text('Student Weekly Report', {
      align: 'center',
    })
    doc.moveDown(1)

    doc.fillColor('#0f172a').font('LatinBold').fontSize(11).text('Student: ', { continued: true })
    writeMixedText(doc, options.profile.full_name || 'No Name')
    doc.font('LatinBold').text('Student ID: ', { continued: true })
    doc.font('Latin').text(options.profile.student_number || 'Pending assignment')
    doc.font('LatinBold').text('Email: ', { continued: true })
    doc.font('Latin').text(options.profile.email || '-')
    doc.font('LatinBold').text('Role: ', { continued: true })
    doc.font('Latin').text(options.profile.role)
    doc.font('LatinBold').text('Week: ', { continued: true })
    doc.font('Latin').text(
      `${formatDisplayDate(options.weekStart)} to ${formatDisplayDate(addDays(options.weekStart, 6))}`,
    )

    sectionHeading(doc, 'Weekly Performance')
    const subjects: Array<[keyof PerformanceRecord, string]> = [
      ['burmese_score', 'Burmese'],
      ['english_score', 'English'],
      ['math_score', 'Math'],
      ['science_score', 'Science'],
      ['sports_score', 'Sports'],
      ['art_score', 'Art'],
      ['social_score', 'Social'],
      ['health_score', 'Health'],
      ['teamwork_score', 'Teamwork'],
      ['discipline_score', 'Discipline'],
    ]

    row(doc, [
      { text: 'Subject', width: 210 },
      { text: 'Rating', width: contentWidth - 210 },
    ], true)

    const performance = options.performances[0]
    if (performance) {
      subjects.forEach(([key, label], index) => {
        row(doc, [
          { text: label, width: 210 },
          { text: String(performance[key] || 'Not Graded'), width: contentWidth - 210, myanmar: true },
        ], index % 2 === 1)
      })
      if (performance.remarks) {
        ensureSpace(doc, 55)
        doc.moveDown(0.8).fillColor('#92400e').font('LatinBold').fontSize(10).text("Teacher's Remarks")
        doc.moveDown(0.2).fillColor('#334155').fontSize(10)
        writeMixedText(doc, performance.remarks, { width: contentWidth, lineGap: 3 })
      }
    } else {
      doc.fillColor('#64748b').font('Latin').fontSize(10).text('No performance data recorded for this week.')
    }

    sectionHeading(doc, 'Attendance')
    const recorded = options.attendance.flatMap((record) => [record.morning_status, record.afternoon_status])
      .filter((status) => status && status !== 'off')
    const present = recorded.filter((status) => status === 'present').length
    const absent = recorded.filter((status) => status === 'absent').length
    const leave = recorded.filter((status) => status === 'leave').length
    const rate = recorded.length ? Math.round((present / recorded.length) * 100) : 0

    doc.fillColor('#334155').font('Latin').fontSize(10).text(
      `Attendance rate: ${rate}%    Present: ${present}    Absent: ${absent}    Leave: ${leave}`,
    )
    doc.moveDown(0.5)
    row(doc, [
      { text: 'Date', width: 190 },
      { text: 'Morning', width: 160 },
      { text: 'Afternoon', width: contentWidth - 350 },
    ], true)

    for (let offset = 0; offset < 7; offset += 1) {
      const date = addDays(options.weekStart, offset)
      const record = options.attendance.find((item) => item.date === date)
      row(doc, [
        { text: formatDisplayDate(date), width: 190 },
        { text: record?.morning_status || 'No Data', width: 160 },
        { text: record?.afternoon_status || 'No Data', width: contentWidth - 350 },
      ], offset % 2 === 1)
    }

    sectionHeading(doc, 'Tuition Fees')
    row(doc, [
      { text: 'Month', width: 150 },
      { text: 'Status', width: 110 },
      { text: 'Remarks', width: contentWidth - 260 },
    ], true)
    if (options.tuitionFees.length) {
      options.tuitionFees.forEach((fee, index) => {
        row(doc, [
          { text: fee.month_year, width: 150 },
          { text: fee.status.toUpperCase(), width: 110 },
          { text: fee.remarks || '-', width: contentWidth - 260, myanmar: true },
        ], index % 2 === 1)
      })
    } else {
      doc.fillColor('#64748b').font('Latin').fontSize(10).text('No tuition fee records found.')
    }

    const pageRange = doc.bufferedPageRange()
    for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex)
      const originalBottomMargin = doc.page.margins.bottom
      doc.page.margins.bottom = 0
      doc.fillColor('#94a3b8').font('Latin').fontSize(8).text(
        `Generated by The Banner Education Centre  |  Page ${pageIndex + 1} of ${pageRange.count}`,
        pageMargin,
        doc.page.height - 26,
        { width: contentWidth, height: 10, align: 'center', lineBreak: false },
      )
      doc.page.margins.bottom = originalBottomMargin
    }

    doc.end()
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const studentId = url.searchParams.get('studentId')
  const requestedWeek = url.searchParams.get('week')
  const weekStart = requestedWeek && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)
    ? requestedWeek
    : getMyanmarWeekStart()

  if (!studentId) {
    return new Response('Student ID is required.', { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return new Response('Unauthorized.', { status: 401 })
  }

  const [{ data: currentProfile }, { data: targetProfile }] = await Promise.all([
    supabase.from('profiles').select('role').eq('id', user.id).single(),
    supabase.from('profiles').select('full_name, email, role, avatar_url, student_number').eq('id', studentId).single(),
  ])

  if (!currentProfile || !targetProfile) {
    return new Response('Profile not found.', { status: 404 })
  }

  const authorized = user.id === studentId || canViewDashboard(currentProfile.role, targetProfile.role)
  if (!authorized) {
    return new Response('Forbidden.', { status: 403 })
  }

  const weekEnd = addDays(weekStart, 6)
  const [performanceResult, tuitionResult, attendanceResult, avatarImage] = await Promise.all([
    supabase
      .from('weekly_performances')
      .select('week_start_date, burmese_score, english_score, math_score, science_score, sports_score, art_score, social_score, health_score, teamwork_score, discipline_score, remarks')
      .eq('student_id', studentId)
      .gte('week_start_date', weekStart)
      .lte('week_start_date', weekEnd)
      .order('week_start_date', { ascending: false }),
    supabase
      .from('monthly_tuition_fees')
      .select('month_year, status, remarks, created_at')
      .eq('student_id', studentId)
      .order('month_year', { ascending: false })
      .limit(12),
    supabase
      .from('daily_attendance')
      .select('date, morning_status, afternoon_status')
      .eq('student_id', studentId)
      .gte('date', weekStart)
      .lte('date', weekEnd)
      .order('date'),
    loadAvatarImage(targetProfile.avatar_url),
  ])

  if (performanceResult.error || tuitionResult.error || attendanceResult.error) {
    console.error('Unable to load student report data', {
      performance: performanceResult.error,
      tuition: tuitionResult.error,
      attendance: attendanceResult.error,
    })
    return new Response('Unable to load report data.', { status: 500 })
  }

  try {
    const pdf = await buildStudentReportPdf({
      profile: targetProfile,
      weekStart,
      performances: (performanceResult.data || []) as PerformanceRecord[],
      tuitionFees: (tuitionResult.data || []) as TuitionFeeRecord[],
      attendance: (attendanceResult.data || []) as AttendanceRecord[],
      avatarImage,
    })
    const safeWeek = weekStart.replace(/[^0-9-]/g, '')

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="student-report-${safeWeek}.pdf"`,
        'Content-Length': String(pdf.length),
        'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (error) {
    console.error('Unable to generate student report PDF', error)
    return new Response('Unable to generate PDF.', { status: 500 })
  }
}
