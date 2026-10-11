import type { Langganan } from './types'

// Penyimpanan sementara di browser (localStorage) sebelum tersambung ke Firebase.

const KEY = 'tongkrongan.langganan.v2'
/** Versi sebelumnya, yang contohnya masih Netflix, Spotify, dan YouTube. Hanya dibaca untuk memindahkan data asli. */
const KEY_LAMA = 'tongkrongan.langganan.v1'

function baca(key: string): Langganan[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data: unknown = JSON.parse(raw)
    const items = (data as { items?: unknown })?.items
    return Array.isArray(items) ? (items as Langganan[]) : null
  } catch {
    return null
  }
}

/** null kalau belum pernah ada yang disimpan. */
export const muatLangganan = () => baca(KEY)

export const muatLanggananLama = () => baca(KEY_LAMA)

/** false kalau browser menolak menyimpan (misalnya mode privat atau penyimpanan penuh). */
export function simpanLangganan(items: Langganan[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items }))
    return true
  } catch {
    return false
  }
}
