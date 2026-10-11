import type { Siklus } from './types'

const rupiahFormat = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
const angkaFormat = new Intl.NumberFormat('id-ID')
const tanggalFormat = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })

/** 186000 -> "Rp 186.000" */
export const rupiah = (nilai: number) => rupiahFormat.format(nilai)

/** 186000 -> "186.000" */
export const angka = (nilai: number) => angkaFormat.format(nilai)

/** Date -> "5 Okt" */
export const tanggalPendek = (date: Date) => tanggalFormat.format(date)

export function sisaHari(selisih: number) {
  if (selisih === 0) return 'hari ini'
  if (selisih === 1) return 'besok'
  if (selisih > 0) return `${selisih} hari lagi`
  return `telat ${-selisih} hari`
}

export const labelSiklus: Record<Siklus, string> = { 1: 'bulan', 3: '3 bulan', 12: 'tahun' }
