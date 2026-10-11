import { usePengguna } from '../../akun/usePengguna'
import './Sapaan.css'

/** "Welcome, username" di paling atas halaman. Sebelum ada login, tempat username-nya berisi titik-titik. */
export function Sapaan() {
  const { username } = usePengguna()
  return (
    <p className="sapaan">
      Welcome,{' '}
      {username ? (
        <span className="sapaan-nama">{username}</span>
      ) : (
        <span aria-label="username">…</span>
      )}
    </p>
  )
}
