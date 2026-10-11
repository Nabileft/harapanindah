import { toInputDate } from './format'
import type { Spot } from './types'

export type PreparedPhoto = { full: Blob; thumb: Blob; width: number; height: number }
export type PhotoInfo = { spot?: Spot; tanggal?: string }

const FULL_SIZE = 2048
const THUMB_SIZE = 480

export class PhotoError extends Error {}

/** Lokasi (GPS) dan tanggal foto dari data EXIF, kalau ada. Foto dari WhatsApp biasanya sudah tidak punya. */
export async function readPhotoInfo(file: File): Promise<PhotoInfo> {
  try {
    const exifr = await import('exifr/dist/lite.esm.mjs')
    const tags = await exifr.parse(file, { xmp: false, icc: false, iptc: false, jfif: false, ihdr: false })
    const taken: unknown = tags?.DateTimeOriginal ?? tags?.CreateDate
    const { latitude, longitude } = tags ?? {}
    const hasSpot = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0)
    return {
      spot: hasSpot ? { lat: latitude, lng: longitude } : undefined,
      tanggal: taken instanceof Date && !Number.isNaN(taken.getTime()) ? toInputDate(taken) : undefined,
    }
  } catch {
    return {}
  }
}

/** Mengecilkan foto supaya ringan disimpan dan ditampilkan, plus membuat versi thumbnail. */
export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  const image = await decode(file)
  try {
    const full = await resize(image, FULL_SIZE, 0.86)
    const thumb = await resize(image, THUMB_SIZE, 0.8)
    return { full: full.blob, thumb: thumb.blob, width: full.width, height: full.height }
  } finally {
    if ('close' in image) image.close()
  }
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    return await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    // Cadangan untuk browser yang createImageBitmap-nya tidak bisa membaca format ini.
    const url = URL.createObjectURL(file)
    try {
      const img = new Image()
      img.src = url
      await img.decode()
      return img
    } catch {
      throw new PhotoError(file.name)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
}

function resize(image: ImageBitmap | HTMLImageElement, maxSide: number, quality: number) {
  const sourceWidth = 'naturalWidth' in image ? image.naturalWidth : image.width
  const sourceHeight = 'naturalHeight' in image ? image.naturalHeight : image.height
  const scale = Math.min(1, maxSide / Math.max(sourceWidth, sourceHeight))
  const width = Math.max(1, Math.round(sourceWidth * scale))
  const height = Math.max(1, Math.round(sourceHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new PhotoError('canvas')
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  return new Promise<{ blob: Blob; width: number; height: number }>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve({ blob, width, height }) : reject(new PhotoError('encode'))),
      'image/jpeg',
      quality,
    )
  })
}
