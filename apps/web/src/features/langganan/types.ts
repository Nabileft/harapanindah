/** Siklus tagihan dalam bulan: bulanan, 3 bulanan, tahunan. */
export type Siklus = 1 | 3 | 12

export type Langganan = {
  id: string
  layanan: string
  /** Warna penanda layanan (hex). */
  warna: string
  /** Harga total per siklus, dalam rupiah. */
  harga: number
  siklus: Siklus
  /** Tanggal jatuh tempo 1–31. Di bulan yang lebih pendek digeser ke hari terakhir bulan itu. */
  tanggal: number
  /** Bulan tagihan pertama, format 'YYYY-MM'. Menentukan bulan tagihan untuk siklus 3 bulanan dan tahunan. */
  mulai: string
  /** Pemilik akun: yang membayar ke layanan dan menerima uang patungan. */
  pemilik: string
  /** Semua yang ikut patungan, termasuk pemilik. */
  anggota: string[]
  /** Siapa yang sudah bayar, per periode. Kuncinya bulan tagihan periode itu ('YYYY-MM'). */
  lunas: Record<string, string[]>
  contoh?: boolean
  dibuat: number
}

/** pemilik = pemilik akun (tidak perlu bayar ke siapa-siapa), telat = lewat jatuh tempo dan belum bayar. */
export type StatusAnggota = 'pemilik' | 'lunas' | 'belum' | 'telat'
