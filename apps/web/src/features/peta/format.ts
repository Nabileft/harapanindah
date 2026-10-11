import type { Memory } from './types'

const dateFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-09-26" -> "26 September 2026" */
export function formatTanggal(tanggal?: string) {
  if (!tanggal) return 'Tanggal belum diisi'
  const date = new Date(`${tanggal}T00:00:00`)
  return Number.isNaN(date.getTime()) ? tanggal : dateFormat.format(date)
}

/** "Jakarta, 17 Agustus 2026". Bagian yang kosong dilewati. */
export function placeAndDate(memory: Pick<Memory, 'kota' | 'tanggal'>) {
  const kota = memory.kota?.trim()
  if (kota && memory.tanggal) return `${kota}, ${formatTanggal(memory.tanggal)}`
  return kota || formatTanggal(memory.tanggal)
}

/** Date -> "YYYY-MM-DD" (zona waktu lokal), untuk input tanggal. */
export function toInputDate(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

/** Terbaru dulu. Kenangan tanpa tanggal ditaruh paling akhir. */
export function byNewest(a: Memory, b: Memory) {
  if (a.tanggal && b.tanggal && a.tanggal !== b.tanggal) return a.tanggal < b.tanggal ? 1 : -1
  if (a.tanggal && !b.tanggal) return -1
  if (!a.tanggal && b.tanggal) return 1
  return b.dibuat - a.dibuat
}

/** Kemiringan kecil yang selalu sama untuk kenangan yang sama, supaya foto di peta terlihat ditempel. */
export function tiltFor(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) | 0
  return ((Math.abs(hash) % 9) - 4) * 0.9
}
