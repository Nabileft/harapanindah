import type { Langganan, StatusAnggota } from './types'

// Perhitungan periode tagihan. Semua fungsi murni, jadi nanti bisa dipindah ke packages/shared
// dan dipakai juga oleh backend (spesifikasi: tagihan dibuat tiap awal periode).

const MS_PER_HARI = 86_400_000

/** Bulan sebagai angka berurutan (tahun * 12 + bulan), supaya gampang dihitung. */
export const indeksBulan = (date: Date) => date.getFullYear() * 12 + date.getMonth()

const dariIndeks = (indeks: number) => ({ tahun: Math.floor(indeks / 12), bulan: indeks % 12 })

export function kunciBulan(indeks: number) {
  const { tahun, bulan } = dariIndeks(indeks)
  return `${tahun}-${String(bulan + 1).padStart(2, '0')}`
}

function indeksDariKunci(kunci: string) {
  const [tahun, bulan] = kunci.split('-').map(Number)
  return tahun * 12 + (bulan - 1)
}

/** Tanggal 29–31 digeser ke hari terakhir di bulan yang lebih pendek. */
function tanggalTagihan(indeks: number, tanggal: number) {
  const { tahun, bulan } = dariIndeks(indeks)
  const hariTerakhir = new Date(tahun, bulan + 1, 0).getDate()
  return new Date(tahun, bulan, Math.min(tanggal, hariTerakhir))
}

export type Periode = {
  /** Bulan tagihan periode ini, 'YYYY-MM'. */
  kunci: string
  jatuhTempo: Date
  berikutnya: Date
}

/** Periode yang sedang berjalan: dimulai di bulan tagihan terakhir, sampai bulan tagihan berikutnya. */
export function periodeSekarang(item: Langganan, hariIni: Date): Periode {
  const mulai = indeksDariKunci(item.mulai)
  const sekarang = indeksBulan(hariIni)
  const ke = sekarang < mulai ? 0 : Math.floor((sekarang - mulai) / item.siklus)
  const indeks = mulai + ke * item.siklus
  return {
    kunci: kunciBulan(indeks),
    jatuhTempo: tanggalTagihan(indeks, item.tanggal),
    berikutnya: tanggalTagihan(indeks + item.siklus, item.tanggal),
  }
}

/** Selisih hari kalender dari `dari` ke `ke`. Negatif berarti sudah lewat. */
export function selisihHari(dari: Date, ke: Date) {
  const a = new Date(dari.getFullYear(), dari.getMonth(), dari.getDate())
  const b = new Date(ke.getFullYear(), ke.getMonth(), ke.getDate())
  return Math.round((b.getTime() - a.getTime()) / MS_PER_HARI)
}

export function statusAnggota(item: Langganan, nama: string, periode: Periode, hariIni: Date): StatusAnggota {
  if (nama === item.pemilik) return 'pemilik'
  if (item.lunas[periode.kunci]?.includes(nama)) return 'lunas'
  return selisihHari(hariIni, periode.jatuhTempo) < 0 ? 'telat' : 'belum'
}

/** Dibagi rata. Sisa pembulatan ditanggung pemilik akun, supaya totalnya tetap pas. */
export function porsi(item: Langganan) {
  const jumlah = Math.max(1, item.anggota.length)
  const perOrang = Math.floor(item.harga / jumlah)
  return { perOrang, pemilik: item.harga - perOrang * (jumlah - 1) }
}

export type Keadaan = {
  periode: Periode
  /** Anggota selain pemilik. */
  penagihan: string[]
  sudahBayar: number
  lunasSemua: boolean
  /** Tanggal yang paling relevan: jatuh tempo periode ini kalau masih ada yang belum bayar, kalau tidak, periode berikutnya. */
  tanggalPenting: Date
}

export function keadaan(item: Langganan, hariIni: Date): Keadaan {
  const periode = periodeSekarang(item, hariIni)
  const penagihan = item.anggota.filter((nama) => nama !== item.pemilik)
  const sudahBayar = penagihan.filter((nama) => item.lunas[periode.kunci]?.includes(nama)).length
  const lunasSemua = sudahBayar === penagihan.length
  return { periode, penagihan, sudahBayar, lunasSemua, tanggalPenting: lunasSemua ? periode.berikutnya : periode.jatuhTempo }
}

/** Yang telat dan jatuh temponya paling dekat di urutan atas. */
export function urutkan(items: Langganan[], hariIni: Date) {
  const tanggal = new Map(items.map((item) => [item.id, keadaan(item, hariIni).tanggalPenting.getTime()]))
  return [...items].sort((a, b) => (tanggal.get(a.id) ?? 0) - (tanggal.get(b.id) ?? 0))
}

/** Bulan tagihan pertama langganan baru: bulan ini kalau tanggalnya belum lewat, kalau sudah lewat, bulan depan. */
export function bulanTagihanPertama(tanggal: number, hariIni: Date) {
  const ini = indeksBulan(hariIni)
  return tanggal >= hariIni.getDate() ? ini : ini + 1
}

export function ringkasan(items: Langganan[], hariIni: Date) {
  let perBulan = 0
  let belumBayar = 0
  let terdekat: { item: Langganan; tanggal: Date } | null = null
  for (const item of items) {
    perBulan += item.harga / item.siklus
    const k = keadaan(item, hariIni)
    belumBayar += k.penagihan.length - k.sudahBayar
    if (!terdekat || k.tanggalPenting < terdekat.tanggal) terdekat = { item, tanggal: k.tanggalPenting }
  }
  return { perBulan: Math.round(perBulan), belumBayar, terdekat }
}
