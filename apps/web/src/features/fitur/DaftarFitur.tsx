import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { Langganan } from '../langganan/Langganan'
import { SampulLangganan } from '../langganan/SampulLangganan'
import { useLangganan } from '../langganan/useLangganan'
import { groupByCity, OTHER_KEY } from '../peta/cities'
import { muatPeta } from '../peta/muatPeta'
import { PetaJejak } from '../peta/PetaJejak'
import { useMemories } from '../peta/useMemories'
import './DaftarFitur.css'

/*
  Daftar fitur di bawah header, terinspirasi daftar film di situs A24:
  judul besar berurutan, label kecil di pojok kanan atas judul.
  Kursor tepat di tulisan judul: judul memudar dan gambarnya muncul di sisi kanan.
  Klik: isi fitur terbuka perlahan langsung di bawah judulnya.
*/

type Fitur = {
  id: string
  judul: string
  label: string
  /** Gambar di sisi kanan saat judul di-hover. */
  pratinjau: ReactNode
  /** Dipanggil saat judul di-hover atau difokus, untuk mulai memuat bagian yang berat lebih awal. */
  siapkan?: () => void
  /** `siap` bernilai true setelah animasi membuka yang pertama selesai. */
  isi: (siap: boolean) => ReactNode
}

/** Lama animasi buka/tutup, dalam milidetik. */
const DURASI = 700
/** Guliran ke judul sedikit lebih lama, supaya berhentinya setelah isinya selesai terbuka. */
const LAMA_GULIR = DURASI + 150

const idDariHash = (ids: string[]) => {
  const hash = decodeURIComponent(window.location.hash.slice(1))
  return ids.includes(hash) ? hash : null
}

const gerakDikurangi = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Menggulir halaman dengan halus sampai `el` ada di atas layar. Posisi tujuannya dihitung ulang tiap frame,
 * karena fitur lain yang sedang menutup ikut menggeser judulnya. Mengembalikan fungsi untuk menghentikannya.
 */
function gulirKe(el: HTMLElement) {
  const tujuan = () => el.getBoundingClientRect().top + window.scrollY
  let frame = 0
  const berhenti = () => {
    cancelAnimationFrame(frame)
    window.removeEventListener('wheel', berhenti)
    window.removeEventListener('touchstart', berhenti)
    window.removeEventListener('keydown', berhenti)
  }

  if (gerakDikurangi()) {
    frame = requestAnimationFrame(() => window.scrollTo({ top: tujuan(), behavior: 'instant' }))
    return berhenti
  }

  const awal = window.scrollY
  let mulai: number | null = null
  const langkah = (waktu: number) => {
    mulai ??= waktu
    const t = Math.min(1, (waktu - mulai) / LAMA_GULIR)
    const halus = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2
    window.scrollTo({ top: awal + (tujuan() - awal) * halus, behavior: 'instant' })
    if (t < 1) frame = requestAnimationFrame(langkah)
    else berhenti()
  }
  frame = requestAnimationFrame(langkah)
  // Kalau pengguna menggulir sendiri di tengah jalan, dia yang menang.
  window.addEventListener('wheel', berhenti, { passive: true })
  window.addEventListener('touchstart', berhenti, { passive: true })
  window.addEventListener('keydown', berhenti)
  return berhenti
}

export function DaftarFitur() {
  const kenangan = useMemories()
  const langganan = useLangganan()
  const [hariIni] = useState(() => new Date())

  const jumlahKota = groupByCity(kenangan.memories).filter((f) => f.key !== OTHER_KEY).length
  const sampul = kenangan.memories.find((m) => m.foto.length > 0)?.foto[0]

  const fitur: Fitur[] = [
    {
      id: 'jejak-kita',
      judul: 'Jejak Kita',
      label: `${jumlahKota} kota`,
      pratinjau: sampul ? <img src={sampul.src} alt="" /> : null,
      siapkan: muatPeta,
      isi: (siap) => <PetaJejak store={kenangan} siap={siap} />,
    },
    {
      id: 'langganan',
      judul: 'Langganan',
      label: `${langganan.items.length} layanan`,
      pratinjau: <SampulLangganan items={langganan.items} hariIni={hariIni} />,
      isi: () => <Langganan store={langganan} />,
    },
  ]

  const ids = fitur.map((f) => f.id)
  const [terbuka, setTerbuka] = useState<string | null>(() => idDariHash(ids))
  // Isi fitur yang pernah dibuka tetap terpasang (hanya disembunyikan), supaya animasi menutupnya bisa
  // berjalan dan membuka lagi terasa instan (peta tidak dimuat ulang, isian form tidak hilang).
  const [pernah, setPernah] = useState<string[]>(() => (terbuka ? [terbuka] : []))
  // Fitur yang animasi membukanya sudah selesai: `siap` sekali untuk selamanya, `tenang` untuk yang sedang terbuka.
  const [siap, setSiap] = useState<string[]>(() => (terbuka ? [terbuka] : []))
  const [tenang, setTenang] = useState<string | null>(terbuka)
  const [disorot, setDisorot] = useState<string | null>(null)
  const [dariAlamat] = useState(terbuka)
  const giliran = useRef(0)
  const hentikanGulir = useRef<() => void>(() => {})

  function toggle(id: string) {
    const buka = terbuka !== id
    const ke = ++giliran.current
    setDisorot(null)
    setTenang(null)
    setTerbuka(buka ? id : null)
    hentikanGulir.current()
    if (!buka) return

    setPernah((list) => (list.includes(id) ? list : [...list, id]))
    // Setelah animasi dan guliran selesai: isi tidak dipotong lagi, dan bagian berat (peta) boleh dipasang.
    window.setTimeout(
      () => {
        if (giliran.current !== ke) return
        setTenang(id)
        setSiap((list) => (list.includes(id) ? list : [...list, id]))
      },
      gerakDikurangi() ? 0 : LAMA_GULIR,
    )
    const judul = document.getElementById(`fitur-${id}`)
    if (judul) hentikanGulir.current = gulirKe(judul)
  }

  // Simpan fitur yang terbuka di alamat (#jejak-kita), supaya bisa dibagikan dan tetap terbuka saat refresh.
  useEffect(() => {
    const alamat = terbuka ? `#${terbuka}` : window.location.pathname + window.location.search
    window.history.replaceState(null, '', alamat)
  }, [terbuka])

  // Alamat diganti saat halaman sudah terbuka (misalnya link #langganan diklik): buka fitur itu.
  useEffect(() => {
    const ikutiAlamat = () => {
      const id = idDariHash(ids)
      if (id && id !== terbuka) toggle(id)
    }
    window.addEventListener('hashchange', ikutiAlamat)
    return () => window.removeEventListener('hashchange', ikutiAlamat)
  })

  // Dibuka lewat alamat: langsung ke judulnya setelah huruf selesai dimuat (ukurannya baru pasti saat itu).
  useEffect(() => {
    if (!dariAlamat) return
    let batal = false
    void document.fonts.ready.then(() => {
      if (!batal) document.getElementById(`fitur-${dariAlamat}`)?.scrollIntoView({ block: 'start' })
    })
    return () => {
      batal = true
    }
  }, [dariAlamat])

  useEffect(() => () => hentikanGulir.current(), [])

  return (
    <div className="fitur" style={{ '--laci': `${DURASI}ms` } as CSSProperties}>
      <div className="fitur-daftar">
        {/* Gambar pratinjau: tetap di sisi kanan, bukan mengikuti kursor. */}
        <div className="fitur-rel" aria-hidden="true">
          <div className="fitur-pratinjau">
            {fitur.map(
              (f) =>
                f.pratinjau && (
                  <div key={f.id} className="pratinjau-item" data-aktif={disorot === f.id && terbuka !== f.id}>
                    {f.pratinjau}
                  </div>
                ),
            )}
          </div>
        </div>

        {fitur.map((f) => {
          const buka = terbuka === f.id
          return (
            <div key={f.id} className="fitur-item" data-open={buka} data-disorot={disorot === f.id}>
              <div className="fitur-baris">
                <h2 className="fitur-heading">
                  <button
                    type="button"
                    id={`fitur-${f.id}`}
                    className="fitur-toggle"
                    aria-expanded={buka}
                    aria-controls={`isi-${f.id}`}
                    onClick={() => toggle(f.id)}
                    onFocus={f.siapkan}
                    onPointerEnter={(event) => {
                      if (event.pointerType !== 'mouse') return
                      f.siapkan?.()
                      setDisorot(f.id)
                    }}
                    onPointerLeave={() => setDisorot((id) => (id === f.id ? null : id))}
                  >
                    <span className="fitur-judul">{f.judul}</span>
                    <span className="fitur-label">{f.label}</span>
                  </button>
                </h2>
                <button
                  type="button"
                  className="fitur-tutup"
                  aria-label={`Tutup ${f.judul}`}
                  inert={!buka}
                  onClick={() => toggle(f.id)}
                >
                  Tutup
                </button>
              </div>

              <div
                id={`isi-${f.id}`}
                role="region"
                aria-labelledby={`fitur-${f.id}`}
                className="fitur-laci"
                data-open={buka}
                data-tenang={buka && tenang === f.id}
                inert={!buka}
              >
                <div className="fitur-isi">
                  <div className="fitur-isi-dalam">{pernah.includes(f.id) && f.isi(siap.includes(f.id))}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
