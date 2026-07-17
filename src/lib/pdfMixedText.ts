const myanmarPattern = /[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff]/
const tokenPattern = /\r?\n|[ \t]+|[\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff\u200c\u200d]+|[^\s\u1000-\u109f\uaa60-\uaa7f\ua9e0-\ua9ff\u200c\u200d]+/gu

function isMyanmar(value: string) {
  return myanmarPattern.test(value)
}

function graphemes(value: string) {
  const segmenter = new Intl.Segmenter('my', { granularity: 'grapheme' })
  return Array.from(segmenter.segment(value), part => part.segment)
}

export function writeMixedPdfText(
  doc: PDFKit.PDFDocument,
  value: string,
  x = doc.x,
  y = doc.y,
  options: PDFKit.Mixins.TextOptions = {},
) {
  const text = value || '-'
  const width = Math.max(1, Number(options.width || (doc.page.width - doc.page.margins.right - x)))
  const maxHeight = typeof options.height === 'number' ? options.height : Number.POSITIVE_INFINITY
  const lineGap = Number(options.lineGap || 0)
  const myanmarFont = 'Myanmar'
  const latinFont = 'Latin'

  doc.font(myanmarFont)
  const myanmarLineHeight = doc.currentLineHeight(true)
  doc.font(latinFont)
  const latinLineHeight = doc.currentLineHeight(true)
  const lineHeight = Math.max(myanmarLineHeight, latinLineHeight) + lineGap
  const right = x + width
  const bottom = y + maxHeight
  let cursorX = x
  let cursorY = y
  let stopped = false

  const nextLine = () => {
    cursorX = x
    cursorY += lineHeight
    if (cursorY + lineHeight > bottom) stopped = true
  }

  const draw = (part: string) => {
    const font = isMyanmar(part) ? myanmarFont : latinFont
    doc.font(font)
    const partWidth = doc.widthOfString(part)
    doc.text(part, cursorX, cursorY, { lineBreak: false })
    cursorX += partWidth
  }

  const tokens = text.match(tokenPattern) || [text]
  for (const token of tokens) {
    if (stopped) break
    if (/^\r?\n$/.test(token)) {
      nextLine()
      continue
    }

    const whitespace = /^[ \t]+$/.test(token)
    const font = isMyanmar(token) ? myanmarFont : latinFont
    doc.font(font)
    const tokenWidth = doc.widthOfString(token)

    if (whitespace) {
      if (cursorX === x) continue
      if (cursorX + tokenWidth > right) nextLine()
      else cursorX += tokenWidth
      continue
    }

    if (cursorX > x && cursorX + tokenWidth > right) nextLine()
    if (stopped) break

    if (tokenWidth <= width) {
      draw(token)
      continue
    }

    for (const cluster of graphemes(token)) {
      if (stopped) break
      doc.font(isMyanmar(cluster) ? myanmarFont : latinFont)
      const clusterWidth = doc.widthOfString(cluster)
      if (cursorX > x && cursorX + clusterWidth > right) nextLine()
      if (!stopped) draw(cluster)
    }
  }

  doc.x = x
  doc.y = Math.min(cursorY + lineHeight, Number.isFinite(bottom) ? bottom : cursorY + lineHeight)
}
