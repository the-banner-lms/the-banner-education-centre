export function writeMixedPdfText(
  doc: PDFKit.PDFDocument,
  value: string,
  x = doc.x,
  y = doc.y,
  options: PDFKit.Mixins.TextOptions = {},
) {
  // The bundled full Z06-Walone Unicode TTF contains both Latin and Myanmar
  // glyphs. Keeping the complete text run intact lets fontkit apply the Myanmar
  // OpenType shaping rules before PDFKit performs its normal line wrapping.
  doc.font('Myanmar').text(value || '-', x, y, options)
}
