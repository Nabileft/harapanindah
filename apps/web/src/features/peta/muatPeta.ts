/**
 * Library peta (MapLibre) cukup besar, jadi dimuat terpisah saat dibutuhkan.
 * Bisa dipanggil lebih awal (misalnya saat judul "Jejak Kita" di-hover) supaya petanya cepat muncul.
 */
export const muatPeta = () => import('./MemoryMap')
