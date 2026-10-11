// Langganan contoh supaya daftarnya tidak kosong saat pertama dibuka: Apple Music Family yang dipakai bareng.
// Harganya harga paket Family di Indonesia sejak Juli 2026. Pemilik akun dan tanggal tagihannya masih perkiraan;
// hapus lewat tombol "Hapus", lalu tambahkan yang benar lewat "Tambah langganan".

import { circle } from '../../dashboard/data/circle'
import { warnaLayanan } from '../layanan'
import { bulanTagihanPertama, kunciBulan } from '../periode'
import type { Langganan } from '../types'

export function contohLangganan(hariIni = new Date()): Langganan[] {
  const nama = circle.members.map((m) => m.name)
  const tanggal = 1

  return [
    {
      id: 'contoh-apple-music',
      layanan: 'Apple Music',
      warna: warnaLayanan('Apple Music'),
      harga: 99000,
      siklus: 1,
      tanggal,
      mulai: kunciBulan(bulanTagihanPertama(tanggal, hariIni)),
      pemilik: nama[0] ?? 'Aku',
      anggota: nama.length > 0 ? nama : ['Aku'],
      lunas: {},
      contoh: true,
      dibuat: 1,
    },
  ]
}
