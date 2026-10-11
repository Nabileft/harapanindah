// Versi "lite" exifr (JPEG + HEIC) tidak membawa tipe sendiri; tipenya sama dengan paket utama.
declare module 'exifr/dist/lite.esm.mjs' {
  export * from 'exifr'
}
