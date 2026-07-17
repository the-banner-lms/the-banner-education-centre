import { createClient } from '@/utils/supabase/server'
import { canViewDashboard } from '@/utils/supabase/queries'
import PDFDocument from 'pdfkit'
import path from 'node:path'
import { writeMixedPdfText } from '@/lib/pdfMixedText'
import {
  addIsoDays,
  getCurrentMyanmarWeek,
  getCurrentReportMonth,
  isReportReleased,
  monthBounds,
  type StudentReportType,
} from '@/lib/studentReportPeriods'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type AttendanceStatus = 'present' | 'absent' | 'leave' | 'off' | null

export interface PerformanceRecord {
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

export interface TuitionFeeRecord {
  month_year: string
  status: string
  amount: number
  remarks: string | null
  created_at: string
}

export interface AttendanceRecord {
  date: string
  morning_status: AttendanceStatus
  afternoon_status: AttendanceStatus
}

const pageMargin = 42
const contentWidth = 595.28 - (pageMargin * 2)
const bottomLimit = 800
const maximumAvatarBytes = 5 * 1024 * 1024

function getMyanmarWeekStart() {
  return getCurrentMyanmarWeek()
}

function addDays(dateString: string, days: number) {
  return addIsoDays(dateString, days)
}

function daysBetween(start: string, end: string) {
  const [startYear, startMonth, startDay] = start.split('-').map(Number)
  const [endYear, endMonth, endDay] = end.split('-').map(Number)
  return Math.floor((Date.UTC(endYear, endMonth - 1, endDay) - Date.UTC(startYear, startMonth - 1, startDay)) / 86_400_000) + 1
}

function buildBurmeseMonthlySummary(performances: PerformanceRecord[], attendance: AttendanceRecord[]) {
  const ratings = performances.flatMap(record => [
    record.burmese_score, record.english_score, record.math_score, record.science_score,
    record.sports_score, record.art_score, record.social_score, record.health_score,
    record.teamwork_score, record.discipline_score,
  ]).filter((value): value is string => Boolean(value))
  const normalized = ratings.map(value => value.toLowerCase())
  const excellent = normalized.filter(value => value.includes('excellent') || value.includes('အထူးကောင်း')).length
  const needsImprovement = normalized.filter(value => value.includes('need') || value.includes('တိုးတက်ရန်')).length
  const recordedAttendance = attendance.flatMap(record => [record.morning_status, record.afternoon_status])
    .filter(status => status && status !== 'off')
  const present = recordedAttendance.filter(status => status === 'present').length
  const attendanceRate = recordedAttendance.length ? Math.round((present / recordedAttendance.length) * 100) : 0

  let learning = 'ယခုလအတွက် သင်ယူမှုအချက်အလက် မပြည့်စုံသေးပါ။'
  if (ratings.length > 0) {
    learning = needsImprovement > Math.max(2, ratings.length / 3)
      ? 'ယခုလတွင် သင်ယူမှုအပိုင်းအချို့ကို ပိုမိုလေ့ကျင့်ရန် လိုအပ်ပါသည်။'
      : excellent >= Math.max(2, ratings.length / 3)
        ? 'ယခုလတွင် သင်ယူမှုရလဒ် အထူးကောင်းမွန်ပါသည်။'
        : 'ယခုလတွင် သင်ယူမှုရလဒ် ကောင်းမွန်ပါသည်။'
  }
  const attendanceText = recordedAttendance.length
    ? ` တက်ရောက်မှု ${attendanceRate}% ရှိပါသည်။`
    : ' တက်ရောက်မှုအချက်အလက် မရှိသေးပါ။'
  const remarkText = performances.some(record => record.remarks?.trim())
    ? ' ဆရာ/ဆရာမ၏ အပတ်စဉ်မှတ်ချက်များကို အောက်တွင် ထည့်သွင်းဖော်ပြထားပါသည်။'
    : ''
  return `${learning}${attendanceText}${remarkText}`
}

function formatDisplayDate(dateString: string) {
  const [year, month, day] = dateString.slice(0, 10).split('-')
  if (!year || !month || !day) return dateString
  return `${day}/${month}/${year.slice(-2)}`
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

export async function loadAvatarImage(avatarUrl: string | null) {
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
      doc.fillColor('#3730a3').font('Helvetica-Bold').fontSize(19).text(
        getProfileInitials(fullName),
        x,
        y + 21,
        { width: size, align: 'center', lineBreak: false },
      )
    }
  } else {
    doc.circle(centerX, centerY, size / 2).fill('#e0e7ff')
    doc.fillColor('#3730a3').font('Helvetica-Bold').fontSize(19).text(
      getProfileInitials(fullName),
      x,
      y + 21,
      { width: size, align: 'center', lineBreak: false },
    )
  }

  doc.circle(centerX, centerY, size / 2).lineWidth(2).strokeColor('#c7d2fe').stroke()
  doc.y = y + size + 14
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
  doc.fillColor('#312e81').font('Helvetica-Bold').fontSize(13).text(title, pageMargin + 10, y + 7)
  doc.y = y + 34
}

async function row(
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
  for (const [index, column] of columns.entries()) {
    if (index > 0) {
      doc.moveTo(x, y).lineTo(x, y + rowHeight).strokeColor('#e2e8f0').stroke()
    }
    doc.fillColor('#334155').fontSize(9)
    if (column.myanmar) {
      doc.x = x + 6
      doc.y = y + 7
      await writeMixedPdfText(doc, column.text, x + 6, y + 7, { width: column.width - 12, height: 18 })
    } else {
      doc.font('Helvetica').text(column.text || '-', x + 6, y + 7, {
        width: column.width - 12,
        height: 14,
        ellipsis: true,
      })
    }
    x += column.width
  }
  doc.y = y + rowHeight
}

export function buildStudentReportPdf(options: {
  profile: { full_name: string | null; email: string | null; role: string; student_number: string | null }
  reportType?: StudentReportType
  weekStart: string
  periodEnd?: string
  performances: PerformanceRecord[]
  tuitionFees: TuitionFeeRecord[]
  attendance: AttendanceRecord[]
  avatarImage?: Buffer | null
}) {
  return new Promise<Buffer>((resolve, reject) => {
    const reportType = options.reportType || 'weekly'
    const periodEnd = options.periodEnd || addDays(options.weekStart, 6)
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: pageMargin, right: pageMargin, bottom: pageMargin, left: pageMargin },
      bufferPages: true,
      info: {
        Title: `${options.profile.full_name || 'Student'} - ${reportType === 'monthly' ? 'Monthly' : 'Weekly'} Report`,
        Author: 'The Banner Education Centre',
      },
    })
    const chunks: Buffer[] = []

    doc.on('data', (chunk: Buffer) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    void (async () => {
    const fontDirectory = path.join(
      process.cwd(),
      'src',
      'assets',
      'fonts',
    )
    const regularFont = path.join(fontDirectory, 'Z06-Walone-Regular.ttf')
    const boldFont = path.join(fontDirectory, 'Z06-Walone-Bold.ttf')
    doc.registerFont('Myanmar', regularFont)
    doc.registerFont('MyanmarBold', boldFont)

    drawCenteredProfilePicture(doc, options.profile.full_name, options.avatarImage)
    doc.fillColor('#312e81').font('Helvetica-Bold').fontSize(20).text('The Banner Education Centre', {
      align: 'center',
    })
    doc.moveDown(0.2).fillColor('#64748b').font('Helvetica').fontSize(12).text(`Student ${reportType === 'monthly' ? 'Monthly Summary' : 'Weekly Report'}`, {
      align: 'center',
    })
    doc.moveDown(1)

    doc.fillColor('#0f172a').font('Helvetica-Bold').fontSize(11).text('Student: ', { continued: true })
    await writeMixedPdfText(doc, options.profile.full_name || 'No Name')
    doc.font('Helvetica-Bold').text('Student ID: ', { continued: true })
    doc.font('Helvetica').text(options.profile.student_number || 'Pending assignment')
    doc.font('Helvetica-Bold').text('Email: ', { continued: true })
    doc.font('Helvetica').text(options.profile.email || '-')
    doc.font('Helvetica-Bold').text('Role: ', { continued: true })
    doc.font('Helvetica').text(options.profile.role)
    doc.font('Helvetica-Bold').text(`${reportType === 'monthly' ? 'Period' : 'Week'}: `, { continued: true })
    doc.font('Helvetica').text(
      `${formatDisplayDate(options.weekStart)} to ${formatDisplayDate(periodEnd)}`,
    )

    if (reportType === 'monthly') {
      sectionHeading(doc, 'Monthly Summary')
      doc.fillColor('#334155').fontSize(10)
      await writeMixedPdfText(doc, buildBurmeseMonthlySummary(options.performances, options.attendance), pageMargin, doc.y, { width: contentWidth, lineGap: 4 })
      doc.moveDown(0.3)
    }

    sectionHeading(doc, reportType === 'monthly' ? 'Weekly Performance Details' : 'Weekly Performance')
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

    if (options.performances.length) {
      for (const [performanceIndex, performance] of options.performances.entries()) {
        if (reportType === 'monthly') {
          ensureSpace(doc, 45)
          doc.fillColor('#475569').font('Helvetica-Bold').fontSize(10).text(
            `Week ${performanceIndex + 1} · ${formatDisplayDate(performance.week_start_date)}`,
          )
          doc.moveDown(0.3)
        }
        await row(doc, [
          { text: 'Subject', width: 210 },
          { text: 'Rating', width: contentWidth - 210 },
        ], true)
        for (const [index, [key, label]] of subjects.entries()) {
          await row(doc, [
            { text: label, width: 210 },
            { text: String(performance[key] || 'Not Graded'), width: contentWidth - 210, myanmar: true },
          ], index % 2 === 1)
        }
        if (performance.remarks) {
          ensureSpace(doc, 55)
          doc.moveDown(0.8).fillColor('#92400e').font('Helvetica-Bold').fontSize(10).text("Teacher's Remarks")
          doc.moveDown(0.2).fillColor('#334155').fontSize(10)
          await writeMixedPdfText(doc, performance.remarks, pageMargin, doc.y, { width: contentWidth, lineGap: 3 })
        }
        if (reportType === 'monthly') doc.moveDown(0.8)
      }
    } else {
      doc.fillColor('#64748b').font('Helvetica').fontSize(10).text(`No performance data recorded for this ${reportType === 'monthly' ? 'month' : 'week'}.`)
    }

    sectionHeading(doc, 'Attendance')
    const recorded = options.attendance.flatMap((record) => [record.morning_status, record.afternoon_status])
      .filter((status) => status && status !== 'off')
    const present = recorded.filter((status) => status === 'present').length
    const absent = recorded.filter((status) => status === 'absent').length
    const leave = recorded.filter((status) => status === 'leave').length
    const rate = recorded.length ? Math.round((present / recorded.length) * 100) : 0

    doc.fillColor('#334155').font('Helvetica').fontSize(10).text(
      `Attendance rate: ${rate}%    Present: ${present}    Absent: ${absent}    Leave: ${leave}`,
    )
    doc.moveDown(0.5)
    await row(doc, [
      { text: 'Date', width: 190 },
      { text: 'Morning', width: 160 },
      { text: 'Afternoon', width: contentWidth - 350 },
    ], true)

    for (let offset = 0; offset < daysBetween(options.weekStart, periodEnd); offset += 1) {
      const date = addDays(options.weekStart, offset)
      const record = options.attendance.find((item) => item.date === date)
      await row(doc, [
        { text: formatDisplayDate(date), width: 190 },
        { text: record?.morning_status || 'No Data', width: 160 },
        { text: record?.afternoon_status || 'No Data', width: contentWidth - 350 },
      ], offset % 2 === 1)
    }

    sectionHeading(doc, 'Tuition Fees')
    await row(doc, [
      { text: 'Month', width: 110 },
      { text: 'Status', width: 90 },
      { text: 'Amount (MMK)', width: 120 },
      { text: 'Remarks', width: contentWidth - 320 },
    ], true)
    if (options.tuitionFees.length) {
      for (const [index, fee] of options.tuitionFees.entries()) {
        await row(doc, [
          { text: fee.month_year, width: 110 },
          { text: fee.status.toUpperCase(), width: 90 },
          { text: new Intl.NumberFormat('en-US').format(Number(fee.amount || 0)), width: 120 },
          { text: fee.remarks || '-', width: contentWidth - 320, myanmar: true },
        ], index % 2 === 1)
      }
    } else {
      doc.fillColor('#64748b').font('Helvetica').fontSize(10).text('No tuition fee records found.')
    }

    const pageRange = doc.bufferedPageRange()
    for (let pageIndex = 0; pageIndex < pageRange.count; pageIndex += 1) {
      doc.switchToPage(pageIndex)
      const originalBottomMargin = doc.page.margins.bottom
      doc.page.margins.bottom = 0
      doc.fillColor('#94a3b8').font('Helvetica').fontSize(8).text(
        `Generated by The Banner Education Centre  |  Page ${pageIndex + 1} of ${pageRange.count}`,
        pageMargin,
        doc.page.height - 26,
        { width: contentWidth, height: 10, align: 'center', lineBreak: false },
      )
      doc.page.margins.bottom = originalBottomMargin
    }

    doc.end()
    })().catch(reject)
  })
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const studentId = url.searchParams.get('studentId')
  const reportType: StudentReportType = url.searchParams.get('type') === 'monthly' ? 'monthly' : 'weekly'
  const requestedWeek = url.searchParams.get('week')
  const weekStart = requestedWeek && /^\d{4}-\d{2}-\d{2}$/.test(requestedWeek)
    ? requestedWeek
    : getMyanmarWeekStart()
  const requestedMonth = url.searchParams.get('month')
  const reportMonth = requestedMonth && /^\d{4}-\d{2}$/.test(requestedMonth)
    ? requestedMonth
    : getCurrentReportMonth()
  const monthlyPeriod = monthBounds(reportMonth)
  const periodStart = reportType === 'monthly' ? monthlyPeriod.start : weekStart
  const periodEnd = reportType === 'monthly' ? monthlyPeriod.end : addDays(weekStart, 6)

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

  const canPreview = ['admin', 'staff'].includes(currentProfile.role)
  const reportPeriod = reportType === 'monthly' ? reportMonth : weekStart
  if (!canPreview && !isReportReleased(reportType, reportPeriod)) {
    return new Response('This report is not available yet.', { status: 403 })
  }

  const [performanceResult, tuitionResult, attendanceResult, avatarImage] = await Promise.all([
    supabase
      .from('weekly_performances')
      .select('week_start_date, burmese_score, english_score, math_score, science_score, sports_score, art_score, social_score, health_score, teamwork_score, discipline_score, remarks')
      .eq('student_id', studentId)
      .gte('week_start_date', periodStart)
      .lte('week_start_date', periodEnd)
      .order('week_start_date', { ascending: true }),
    supabase
      .from('monthly_tuition_fees')
      .select('month_year, status, amount, remarks, created_at')
      .eq('student_id', studentId)
      .gte('month_year', reportType === 'monthly' ? reportMonth : '0000-00')
      .lte('month_year', reportType === 'monthly' ? reportMonth : '9999-99')
      .order('month_year', { ascending: false })
      .limit(reportType === 'monthly' ? 1 : 12),
    supabase
      .from('daily_attendance')
      .select('date, morning_status, afternoon_status')
      .eq('student_id', studentId)
      .gte('date', periodStart)
      .lte('date', periodEnd)
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
      reportType,
      weekStart: periodStart,
      periodEnd,
      performances: (performanceResult.data || []) as PerformanceRecord[],
      tuitionFees: (tuitionResult.data || []) as TuitionFeeRecord[],
      attendance: (attendanceResult.data || []) as AttendanceRecord[],
      avatarImage,
    })
    const safePeriod = reportPeriod.replace(/[^0-9-]/g, '')
    const filename = `student-${reportType}-report-${safePeriod}.pdf`

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
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
