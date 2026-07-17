import 'server-only'

import { createHash } from 'node:crypto'
import sharp from 'sharp'
import { PAYMENT_METHODS, type PaymentMethod } from '@/lib/paymentMethods'

export type SlipAnalysis = {
  buffer: Buffer
  sha256: string
  perceptualHash: string | null
  detectedMimeType: 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
  width: number | null
  height: number | null
  flags: string[]
  hardError: string | null
}

function detectMimeType(buffer: Buffer): SlipAnalysis['detectedMimeType'] | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg'
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png'
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return 'image/webp'
  if (buffer.length >= 5 && buffer.toString('ascii', 0, 5) === '%PDF-') return 'application/pdf'
  return null
}

function createDifferenceHash(pixels: Buffer) {
  let bits = ''
  for (let row = 0; row < 8; row += 1) {
    for (let column = 0; column < 8; column += 1) {
      const offset = row * 9 + column
      bits += pixels[offset] > pixels[offset + 1] ? '1' : '0'
    }
  }

  return BigInt(`0b${bits}`).toString(16).padStart(16, '0')
}

export function normalizeTransactionId(value: string) {
  return value.trim().toUpperCase().replace(/\s+/g, '')
}

export function isPaymentMethod(value: string): value is PaymentMethod {
  return PAYMENT_METHODS.some(method => method.value === value)
}

export function hashSubmissionFingerprint(ipAddress: string, userAgent: string) {
  return createHash('sha256').update(`${ipAddress.trim()}|${userAgent.slice(0, 300)}`).digest('hex')
}

export function perceptualHashDistance(first: string, second: string) {
  if (!/^[0-9a-f]{16}$/i.test(first) || !/^[0-9a-f]{16}$/i.test(second)) return 64
  let differentBits = BigInt(`0x${first}`) ^ BigInt(`0x${second}`)
  let distance = 0
  while (differentBits > BigInt(0)) {
    distance += Number(differentBits & BigInt(1))
    differentBits = differentBits >> BigInt(1)
  }
  return distance
}

export async function analyzePaymentSlip(file: File): Promise<SlipAnalysis> {
  const buffer = Buffer.from(await file.arrayBuffer())
  const sha256 = createHash('sha256').update(buffer).digest('hex')
  const detectedMimeType = detectMimeType(buffer)

  if (!detectedMimeType || detectedMimeType !== file.type) {
    return {
      buffer,
      sha256,
      perceptualHash: null,
      detectedMimeType: detectedMimeType || 'application/pdf',
      width: null,
      height: null,
      flags: ['file_signature_mismatch'],
      hardError: 'This file is not a valid JPG, PNG, WebP or PDF payment slip.',
    }
  }

  if (buffer.length < 10 * 1024) {
    return {
      buffer,
      sha256,
      perceptualHash: null,
      detectedMimeType,
      width: null,
      height: null,
      flags: ['file_too_small'],
      hardError: 'The uploaded payment slip is too small or incomplete.',
    }
  }

  if (detectedMimeType === 'application/pdf') {
    return {
      buffer,
      sha256,
      perceptualHash: null,
      detectedMimeType,
      width: null,
      height: null,
      flags: ['pdf_requires_manual_review'],
      hardError: null,
    }
  }

  try {
    const image = sharp(buffer, { failOn: 'warning', limitInputPixels: 40_000_000 }).rotate()
    const metadata = await image.metadata()
    const width = metadata.width || null
    const height = metadata.height || null

    if (!width || !height || width < 200 || height < 200) {
      return {
        buffer,
        sha256,
        perceptualHash: null,
        detectedMimeType,
        width,
        height,
        flags: ['invalid_image_dimensions'],
        hardError: 'The payment slip image is too small to review. Upload a clearer image.',
      }
    }

    const [hashPixels, detailPixels] = await Promise.all([
      image.clone().resize(9, 8, { fit: 'fill' }).greyscale().raw().toBuffer(),
      image.clone().resize(64, 64, { fit: 'fill' }).greyscale().raw().toBuffer(),
    ])

    const average = detailPixels.reduce((sum, pixel) => sum + pixel, 0) / detailPixels.length
    const variance = detailPixels.reduce((sum, pixel) => sum + ((pixel - average) ** 2), 0) / detailPixels.length
    const deviation = Math.sqrt(variance)
    const flags: string[] = []

    if (width < 600 || height < 400) flags.push('low_resolution')
    if (deviation < 12) flags.push('low_detail')
    if (deviation < 3 || average < 4 || average > 251) {
      return {
        buffer,
        sha256,
        perceptualHash: createDifferenceHash(hashPixels),
        detectedMimeType,
        width,
        height,
        flags: [...flags, 'blank_or_unreadable_image'],
        hardError: 'The uploaded image appears blank or unreadable. Upload the original payment slip.',
      }
    }

    return {
      buffer,
      sha256,
      perceptualHash: createDifferenceHash(hashPixels),
      detectedMimeType,
      width,
      height,
      flags,
      hardError: null,
    }
  } catch {
    return {
      buffer,
      sha256,
      perceptualHash: null,
      detectedMimeType,
      width: null,
      height: null,
      flags: ['corrupt_image'],
      hardError: 'The payment slip image is corrupt or cannot be read.',
    }
  }
}
