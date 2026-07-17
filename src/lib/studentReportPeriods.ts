const MYANMAR_OFFSET_MINUTES = 390

export type StudentReportType = 'weekly' | 'monthly'

function utcDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

export function addIsoDays(value: string, days: number) {
  const date = utcDate(value)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function getMyanmarToday(now = new Date()) {
  return new Date(now.getTime() + (MYANMAR_OFFSET_MINUTES * 60_000)).toISOString().slice(0, 10)
}

export function getMonday(value: string) {
  const date = utcDate(value)
  const day = date.getUTCDay()
  return addIsoDays(value, day === 0 ? -6 : 1 - day)
}

export function getCurrentMyanmarWeek(now = new Date()) {
  return getMonday(getMyanmarToday(now))
}

export function monthBounds(month: string) {
  const match = /^(\d{4})-(\d{2})$/.exec(month)
  if (!match) throw new Error('Invalid report month.')
  const year = Number(match[1])
  const monthIndex = Number(match[2]) - 1
  const start = new Date(Date.UTC(year, monthIndex, 1))
  const next = new Date(Date.UTC(year, monthIndex + 1, 1))
  const end = new Date(next)
  end.setUTCDate(end.getUTCDate() - 1)
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
    nextStart: next.toISOString().slice(0, 10),
  }
}

function myanmarMidnightToUtc(value: string) {
  return new Date(utcDate(value).getTime() - (MYANMAR_OFFSET_MINUTES * 60_000))
}

export function getReportReleaseAt(type: StudentReportType, period: string) {
  const releaseDate = type === 'weekly'
    ? addIsoDays(period, 7)
    : monthBounds(period).nextStart
  return myanmarMidnightToUtc(releaseDate)
}

export function isReportReleased(type: StudentReportType, period: string, now = new Date()) {
  return now.getTime() >= getReportReleaseAt(type, period).getTime()
}

export function formatReportRelease(type: StudentReportType, period: string) {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Yangon',
  }).format(getReportReleaseAt(type, period))
}

export function getRecentWeeklyPeriods(count = 5, now = new Date()) {
  const current = getCurrentMyanmarWeek(now)
  return Array.from({ length: count }, (_, index) => addIsoDays(current, index * -7))
}

export function getCurrentReportMonth(now = new Date()) {
  return getMyanmarToday(now).slice(0, 7)
}

export function getPreviousMonth(month: string) {
  const { start } = monthBounds(month)
  const date = utcDate(start)
  date.setUTCMonth(date.getUTCMonth() - 1)
  return date.toISOString().slice(0, 7)
}

export function formatReportPeriod(type: StudentReportType, period: string) {
  if (type === 'weekly') {
    const end = addIsoDays(period, 6)
    const formatter = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    return `${formatter.format(utcDate(period))} – ${formatter.format(utcDate(end))}`
  }
  return new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(utcDate(`${period}-01`))
}

export function getWeekOfMonth(weekStart: string) {
  return Math.ceil(Number(weekStart.slice(8, 10)) / 7)
}
