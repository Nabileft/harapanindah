// Daftar layanan sesuai spesifikasi (form Tambah Langganan). Warnanya hanya penanda kecil di daftar.

export const DAFTAR_LAYANAN = [
  { nama: 'Apple Music', warna: '#fa243c' },
  { nama: 'Netflix', warna: '#e50914' },
  { nama: 'Spotify', warna: '#1ed760' },
  { nama: 'YouTube Premium', warna: '#ff0033' },
  { nama: 'Disney+ Hotstar', warna: '#1f80e0' },
  { nama: 'Vidio', warna: '#f0364f' },
  { nama: 'Prime Video', warna: '#00a8e1' },
  { nama: 'iCloud', warna: '#3693f3' },
  { nama: 'Google One', warna: '#4285f4' },
  { nama: 'ChatGPT', warna: '#10a37f' },
  { nama: 'Canva', warna: '#8b3dff' },
] as const

export const WARNA_LAINNYA = '#d6cdb0'

export const warnaLayanan = (nama: string) =>
  DAFTAR_LAYANAN.find((l) => l.nama.toLowerCase() === nama.trim().toLowerCase())?.warna ?? WARNA_LAINNYA
