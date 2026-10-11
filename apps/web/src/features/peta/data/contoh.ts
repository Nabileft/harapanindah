// Kenangan contoh supaya peta tidak kosong saat pertama dibuka.
// Lokasinya masih perkiraan: ganti lat/lng, judul, dan tanggal sesuai aslinya, atau hapus entri ini.
// Nanti data kenangan diambil dari Firestore.

import pantai from '../../../assets/hero/photo.webp'
import type { Memory } from '../types'

export const contohKenangan: Memory[] = [
  {
    id: 'contoh-pantai',
    judul: 'Malam di pantai',
    cerita: 'Ini contoh. Lokasi dan tanggalnya belum sesuai foto aslinya.',
    kota: 'Jakarta',
    lat: -6.1218,
    lng: 106.8455,
    foto: [{ src: pantai, thumb: pantai, width: 1200, height: 1600 }],
    asal: 'contoh',
    dibuat: 0,
  },
]
