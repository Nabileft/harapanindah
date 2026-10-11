# Tongkrongan

Web app Tongkrongan (satu codebase untuk desktop dan HP). Struktur foldernya mengikuti spesifikasi: monorepo pnpm dengan `apps/web` untuk frontend. Backend (`server/`, `netlify/functions/`) dan `packages/shared` menyusul.

Isinya sejauh ini:

- **Header dashboard**: foto tongkrongan dengan judul di belakang kepala. Arahkan kursor ke salah satu orang, orangnya membesar dan nama + keterangannya muncul.
- **Daftar fitur** (scroll ke bawah), gayanya seperti daftar film di situs A24: judul besar berurutan. Arahkan kursor ke tulisan judul untuk melihat gambarnya di sisi kanan, klik untuk membuka fiturnya langsung di bawah judul.
  - **Jejak Kita**: peta malam berisi foto-foto kenangan yang ditaruh di lokasinya, dengan folder per kota di bawahnya.
  - **Langganan**: daftar langganan patungan (Netflix, Spotify, dll.), berapa per orang, kapan jatuh tempo, dan siapa yang sudah bayar.

## Menjalankan di VS Code

Butuh Node.js 20.19+ atau 22.12+, dan pnpm.

1. Buka folder `tongkrongan` di VS Code (**File → Open Folder**).
2. Pasang extension yang disarankan saat VS Code menawarkan (Tailwind CSS IntelliSense, Oxc).
3. Buka terminal (**Ctrl + `**), lalu jalankan:

   ```bash
   npm install -g pnpm   # sekali saja, kalau belum punya pnpm
   pnpm install
   pnpm dev
   ```

4. Buka http://localhost:5173

Perintah lain: `pnpm build` (hasil di `apps/web/dist`), `pnpm preview`, `pnpm lint`.

Kalau ada library baru (misalnya setelah section peta ditambahkan, atau huruf baru), hentikan `pnpm dev` dengan Ctrl + C, jalankan `pnpm install`, lalu `pnpm dev` lagi.

## Mengganti judul, nama, dan keterangan

Semuanya di satu file: `apps/web/src/features/dashboard/data/circle.ts`

- `name` adalah judul tongkrongan yang tampil di foto. Ukurannya otomatis menyesuaikan panjang nama.
- `members` berisi nama dan keterangan tiap orang, urut dari kiri ke kanan sesuai foto.

## Struktur

```text
apps/web/src/
  features/dashboard/
    DashboardPage.tsx            halaman dashboard: header, sapaan, daftar fitur
    components/HeroHeader.tsx    header foto + efek hover
    components/Sapaan.tsx        tulisan "Welcome, username" di paling atas halaman
    components/HeroHeader.css    lapisan foto, efek pop out, label nama
    data/circle.ts               judul, nama, keterangan  <- yang diedit
    data/heroPhoto.ts            posisi & garis tepi tiap orang di foto (dibuat otomatis)
  features/fitur/
    DaftarFitur.tsx              daftar fitur ala A24: judul, gambar pratinjau, buka-tutup  <- tambah fitur di sini
    DaftarFitur.css              ukuran judul, warna hover, posisi gambar, animasi buka-tutup
  features/peta/
    PetaJejak.tsx                isi fitur "Jejak Kita": peta, panel, folder kota
    MemoryMap.tsx                peta MapLibre + pin foto (dimuat terpisah lewat muatPeta.ts)
    mapStyle.ts                  warna peta malam
    MemoryForm.tsx               form "Tambah kenangan"
    MemoryDetail.tsx             panel detail kenangan
    useMemories.ts               sumber data kenangan (nanti diganti Firestore)
    cities.ts                    pengelompokan folder per kota
    geocode.ts                   nama kota dari koordinat (Nominatim OpenStreetMap)
    data/contoh.ts               kenangan contoh  <- ganti atau hapus
  features/langganan/
    Langganan.tsx                isi fitur "Langganan": ringkasan, daftar, form tambah
    SampulLangganan.tsx          gambar pratinjau saat judul "Langganan" di-hover
    periode.ts                   hitungan periode tagihan, jatuh tempo, bagi rata
    layanan.ts                   daftar layanan + warnanya
    useLangganan.ts              sumber data langganan (nanti diganti Firestore)
    data/contoh.ts               langganan contoh  <- ganti atau hapus
  assets/hero/                   foto + potongan tiap orang (WebP transparan)
  features/akun/
    usePengguna.ts               akun yang sedang login (username); sekarang masih kosong
  index.css                      Tailwind, warna, huruf, tombol
```

## Daftar fitur (gaya A24)

- Semua tulisan di web memakai satu huruf, **Inter Tight**, dengan ketebalan tipis untuk judul. Situs A24 memakai NB International (huruf berbayar), jadi dipakai yang paling mirip dan gratis. Pengecualiannya judul tongkrongan di foto header, yang tetap memakai **League Gothic** (tinggi dan tebal).
- Di paling atas halaman, di tengah, ada sapaan **Welcome, username**. Login belum dibuat, jadi tempat username-nya masih berisi titik-titik; setelah login Google + onboarding jadi, cukup `features/akun/usePengguna.ts` yang diganti.
- Hover hanya bereaksi kalau kursor tepat di tulisan judul (bukan di sepanjang barisnya). Judulnya memudar dan gambarnya muncul di sisi kanan. Gambarnya diam di tempat; kalau ada fitur yang sedang terbuka, gambarnya tampil di tengah layar sebelah kanan. Di HP tidak ada hover, cukup ketuk judulnya.
- Gambar **Jejak Kita** adalah foto kenangan terbaru. Gambar **Langganan** adalah sampul langganan yang paling dekat jatuh temponya (sekarang Apple Music), dibuat dari warna layanannya.
- Klik judul: isinya terbuka perlahan di bawah judul sambil halaman bergulir sampai judulnya di atas layar. Klik judulnya lagi atau **Tutup** untuk menutup. Hanya satu fitur yang terbuka sekaligus. Isi yang pernah dibuka tetap disimpan, jadi membuka lagi terasa instan (peta tidak dimuat ulang).
- Alamatnya ikut berubah (`/#jejak-kita`, `/#langganan`), jadi link itu bisa dibagikan dan fiturnya tetap terbuka saat halaman di-refresh.
- Lama animasinya diatur di `DURASI` di `DaftarFitur.tsx`.
- Menambah fitur baru: tambahkan satu isian di daftar `fitur` di `DaftarFitur.tsx` (`id`, `judul`, `label`, `pratinjau`, `isi`).

## Cara kerja Langganan

- Tiap langganan punya harga total, siklus (bulanan, 3 bulanan, tahunan), tanggal jatuh tempo, pemilik akun, dan siapa saja yang ikut patungan.
- Harga dibagi rata ke semua yang ikut. Kalau tidak habis dibagi, sisanya ditanggung pemilik akun.
- Klik nama teman untuk menandai dia sudah bayar periode ini (klik lagi untuk membatalkan). Pemilik akun tidak perlu ditandai. Nama yang belum bayar setelah jatuh tempo lewat jadi merah.
- Jatuh tempo tanggal 29–31 digeser ke hari terakhir di bulan yang lebih pendek (misalnya 31 jadi 28 Februari).
- Saat pertama kali dibuka ada satu langganan contoh (tanda "Contoh"): Apple Music Family, Rp 99.000/bulan (harga di Indonesia sejak Juli 2026), dibagi 5 orang. Pemilik akun dan tanggal tagihannya masih perkiraan. Hapus lewat tombol **Hapus**, lalu tambahkan yang benar lewat **Tambah langganan**; contohnya tidak akan muncul lagi.
- **Untuk sementara langganan disimpan di browser (localStorage)**, sama seperti kenangan di peta. Setelah Firebase tersambung, cukup `useLangganan.ts` yang diganti.

## Cara kerja header

- Tiap orang di foto sudah dipotong jadi gambar transparan sendiri (`assets/hero/person-*.webp`) dan ditaruh persis di atas fotonya. Karena itu judulnya bisa terlihat ada di belakang kepala.
- Area hover mengikuti garis tepi badan tiap orang (SVG path), bukan kotak.
- Saat di-hover: foto meredup, orang itu membesar dari kaki, dan labelnya muncul di atas kepala. Di HP caranya diketuk; di keyboard pakai Tab, Esc untuk menutup.
- Semua ukuran memakai satuan relatif terhadap foto, jadi posisinya pas di HP, tablet, maupun desktop.
- Ada dua tampilan, dipilih di `apps/web/src/features/dashboard/DashboardPage.tsx`: `layout="fullscreen"` (foto memenuhi layar, di laptop bagian kaki terpotong) atau `layout="framed"` (foto utuh di tengah).

Kalau fotonya diganti, potongan orang dan `heroPhoto.ts` perlu dibuat ulang dari foto baru.

## Cara kerja peta (Jejak Kita)

- Peta memakai MapLibre dengan data OpenStreetMap dari OpenFreeMap (gratis, tanpa API key). Warnanya diatur di `mapStyle.ts`.
- Tombol **Tambah kenangan**: pilih foto dulu. Kalau fotonya menyimpan lokasi dan tanggal (foto langsung dari kamera HP biasanya ada, foto dari WhatsApp biasanya sudah hilang), pin langsung ditaruh di sana. Kalau tidak, klik peta untuk menandai lokasinya.
- Foto dikecilkan dulu (maks. 2048 px) sebelum disimpan, jadi foto HP yang besar tetap ringan.
- **Folder per kota** di bawah peta: nama kota diisi otomatis dari lokasi (lewat Nominatim OpenStreetMap, gratis tanpa API key) dan masih bisa diubah di form. Semua wilayah Jakarta digabung jadi "Jakarta", awalan "Kota"/"Kabupaten" dibuang. Kenangan yang kotanya belum diketahui masuk folder "Lainnya" dan dicoba diisi lagi saat halaman dibuka. Membuka folder membuat peta hanya menampilkan pin kota itu.
- **Untuk sementara kenangan disimpan di browser (IndexedDB)**, jadi hanya terlihat di browser dan perangkat yang dipakai saat menambahkannya. Setelah Firebase tersambung, cukup `useMemories.ts` yang diganti supaya semua anggota melihat kenangan yang sama.
- Scroll di atas peta tetap menggulir halaman. Untuk zoom pakai tombol +/−, atau tahan ⌘ (Mac) / Ctrl sambil scroll. Di HP geser peta dengan dua jari.
