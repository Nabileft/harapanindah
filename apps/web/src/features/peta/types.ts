export type MemoryPhoto = {
  /** Foto ukuran penuh, untuk panel detail dan tampilan layar penuh. */
  src: string
  /** Versi kecil, untuk pin di peta dan daftar kenangan. */
  thumb: string
  width: number
  height: number
}

export type Memory = {
  id: string
  judul: string
  /** Format YYYY-MM-DD. Boleh kosong kalau tanggalnya tidak ingat. */
  tanggal?: string
  cerita?: string
  /** Nama kota, dipakai untuk folder per kota di bawah peta. Kosong = folder "Lainnya". */
  kota?: string
  lat: number
  lng: number
  foto: MemoryPhoto[]
  /**
   * 'contoh' = data contoh yang ditulis di kode (data/contoh.ts).
   * 'lokal'  = ditambahkan lewat tombol "Tambah kenangan", tersimpan di browser ini.
   */
  asal: 'contoh' | 'lokal'
  /** Waktu dibuat (ms), untuk mengurutkan kenangan yang tanggalnya sama. */
  dibuat: number
}

/** Titik di peta. */
export type Spot = { lng: number; lat: number }

/** Lokasi kenangan baru yang sedang ditambahkan, dan apakah asalnya dari data foto. */
export type DraftSpot = { spot: Spot; fromPhoto: boolean }
