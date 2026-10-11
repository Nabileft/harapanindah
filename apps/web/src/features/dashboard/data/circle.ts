// Data tongkrongan yang tampil di header dashboard.
// Ganti nama & keterangan di sini. Urutan anggota = urutan orang di foto, dari kiri ke kanan.
// Nanti data ini diambil dari Firestore (dokumen circle + daftar member).

export type Member = {
  name: string
  keterangan: string
}

export type Circle = {
  name: string
  members: Member[]
}

export const circle: Circle = {
  name: 'HARAPAN INDAH',
  members: [
    // 1. paling kiri, kaos putih "773"
    { name: 'femboys', keterangan: 'Keterangan belum diisi' },
    // 2. kemeja hitam motif
    { name: '(y)arsi', keterangan: 'Keterangan belum diisi' },
    // 3. tengah, kaos navy polos
    { name: 'R4NU', keterangan: 'Keterangan belum diisi' },
    // 4. kaos lengan panjang navy
    { name: 'nigga_destroyer69', keterangan: 'Keterangan belum diisi' },
    // 5. paling kanan, kaos abu-abu
    { name: 'Brad pitt', keterangan: 'Keterangan belum diisi' },
  ],
}
