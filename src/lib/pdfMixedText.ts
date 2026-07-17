import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import * as fontkit from 'fontkit'
import sharp from 'sharp'

const myanmarPattern = /[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]/
const scale = 3
const cache = new Map<string, Promise<RenderedText>>()

type MixedTextOptions = PDFKit.Mixins.TextOptions & {
  myanmarBold?: boolean
  myanmarColor?: string
}

type RenderedText = {
  png: Buffer
  height: number
}

const fontDirectory = path.join(process.cwd(), 'src', 'assets', 'fonts')
const regularFontPath = path.join(fontDirectory, 'Z06-Walone-Regular.ttf')
const boldFontPath = path.join(fontDirectory, 'Z06-Walone-Bold.ttf')
const regularFontBuffer = fs.readFileSync(regularFontPath)
const boldFontBuffer = fs.readFileSync(boldFontPath)
const regularFont = fontkit.create(regularFontBuffer) as fontkit.Font
const boldFont = fontkit.create(boldFontBuffer) as fontkit.Font

function escapeXml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function measure(value: string, fontSize: number, bold: boolean) {
  const font = bold ? boldFont : regularFont
  return (font.layout(value).advanceWidth / font.unitsPerEm) * fontSize
}

function splitLongToken(token: string, width: number, fontSize: number, bold: boolean) {
  const segmenter = new Intl.Segmenter('my', { granularity: 'grapheme' })
  const parts: string[] = []
  let current = ''
  for (const item of segmenter.segment(token)) {
    const candidate = current + item.segment
    if (current && measure(candidate, fontSize, bold) > width) {
      parts.push(current)
      current = item.segment
    } else {
      current = candidate
    }
  }
  if (current) parts.push(current)
  return parts
}

function wrapText(value: string, width: number, fontSize: number, bold: boolean) {
  const lines: string[] = []
  for (const paragraph of value.replaceAll('\r', '').split('\n')) {
    const words = paragraph.trim().split(/\s+/).filter(Boolean)
    if (!words.length) {
      lines.push('')
      continue
    }
    let line = ''
    for (const word of words) {
      const pieces = measure(word, fontSize, bold) > width
        ? splitLongToken(word, width, fontSize, bold)
        : [word]
      for (const piece of pieces) {
        const candidate = line ? `${line} ${piece}` : piece
        if (line && measure(candidate, fontSize, bold) > width) {
          lines.push(line)
          line = piece
        } else {
          line = candidate
        }
      }
    }
    if (line) lines.push(line)
  }
  return lines.length ? lines : ['-']
}

async function renderMyanmarText(
  value: string,
  width: number,
  fontSize: number,
  lineGap: number,
  maxHeight: number | undefined,
  bold: boolean,
  color: string,
  align: PDFKit.Mixins.TextOptions['align'],
) {
  const key = crypto.createHash('sha256').update(JSON.stringify({ value, width, fontSize, lineGap, maxHeight, bold, color, align })).digest('hex')
  const existing = cache.get(key)
  if (existing) return existing

  const promise = (async () => {
    const padding = 2
    const lineHeight = (fontSize * 1.55) + lineGap
    let lines = wrapText(value || '-', Math.max(1, width - (padding * 2)), fontSize, bold)
    if (maxHeight && Number.isFinite(maxHeight)) {
      const maxLines = Math.max(1, Math.floor(maxHeight / lineHeight))
      if (lines.length > maxLines) {
        lines = lines.slice(0, maxLines)
        const finalIndex = lines.length - 1
        while (lines[finalIndex] && measure(`${lines[finalIndex]}…`, fontSize, bold) > width - (padding * 2)) {
          lines[finalIndex] = lines[finalIndex].slice(0, -1)
        }
        lines[finalIndex] = `${lines[finalIndex]}…`
      }
    }

    const height = Math.max(lineHeight, lines.length * lineHeight) + (padding * 2)
    const pixelWidth = Math.max(1, Math.ceil(width * scale))
    const pixelHeight = Math.max(1, Math.ceil(height * scale))
    const fontBuffer = bold ? boldFontBuffer : regularFontBuffer
    const family = bold ? 'Walone Bold' : 'Walone Regular'
    const anchor = align === 'center' ? 'middle' : align === 'right' ? 'end' : 'start'
    const x = align === 'center' ? pixelWidth / 2 : align === 'right' ? pixelWidth - (padding * scale) : padding * scale
    const baseline = (padding + (fontSize * 0.95)) * scale
    const tspans = lines.map((line, index) => (
      `<text x="${x}" y="${baseline + (index * lineHeight * scale)}" text-anchor="${anchor}" fill="${escapeXml(color)}" font-family="${family}" font-size="${fontSize * scale}">${escapeXml(line)}</text>`
    )).join('')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pixelWidth}" height="${pixelHeight}">
      <style>@font-face{font-family:'${family}';src:url(data:font/ttf;base64,${fontBuffer.toString('base64')}) format('truetype');}</style>
      ${tspans}
    </svg>`
    return {
      png: await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer(),
      height,
    }
  })()

  cache.set(key, promise)
  if (cache.size > 200) cache.delete(cache.keys().next().value as string)
  return promise
}

export async function writeMixedPdfText(
  doc: PDFKit.PDFDocument,
  value: string,
  x = doc.x,
  y = doc.y,
  options: MixedTextOptions = {},
) {
  if (!myanmarPattern.test(value || '')) {
    doc.text(value || '-', x, y, options)
    return
  }

  const width = Math.max(1, Number(options.width || (doc.page.width - doc.page.margins.right - x)))
  const fontSize = Number((doc as PDFKit.PDFDocument & { _fontSize?: number })._fontSize || 12)
  const rendered = await renderMyanmarText(
    value || '-',
    width,
    fontSize,
    Number(options.lineGap || 0),
    typeof options.height === 'number' ? options.height : undefined,
    Boolean(options.myanmarBold),
    options.myanmarColor || '#334155',
    options.align,
  )
  const height = typeof options.height === 'number' ? Math.min(options.height, rendered.height) : rendered.height
  doc.image(rendered.png, x, y, { width, height })
  doc.x = x
  doc.y = y + height
}
