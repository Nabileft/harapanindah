export type Pengguna = {
  /** Username dari onboarding (huruf kecil, angka, garis bawah). null kalau belum login. */
  username: string | null
}

/**
 * Akun yang sedang login. Login dengan Google (Firebase Auth) belum dibuat, jadi untuk sekarang
 * username-nya masih kosong. Setelah login dan onboarding jadi, cukup hook ini yang diganti.
 */
export function usePengguna(): Pengguna {
  return { username: null }
}
