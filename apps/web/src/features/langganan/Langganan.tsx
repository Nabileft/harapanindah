import { useId, useMemo, useState, type CSSProperties, type FormEvent } from 'react'
import { circle } from '../dashboard/data/circle'
import { angka, labelSiklus, rupiah, sisaHari, tanggalPendek } from './format'
import { DAFTAR_LAYANAN, warnaLayanan } from './layanan'
import {
  bulanTagihanPertama,
  keadaan,
  kunciBulan,
  porsi,
  ringkasan,
  selisihHari,
  statusAnggota,
  urutkan,
} from './periode'
import type { Langganan as Item, Siklus } from './types'
import type { LanggananBaru, LanggananStore } from './useLangganan'
import './Langganan.css'

export function Langganan({ store }: { store: LanggananStore }) {
  const { items, tambah, hapus, tandaiBayar, tersimpan } = store
  const [hariIni] = useState(() => new Date())
  const [menambah, setMenambah] = useState(false)

  const urut = useMemo(() => urutkan(items, hariIni), [items, hariIni])
  const total = ringkasan(items, hariIni)
  const sisaTerdekat = total.terdekat ? selisihHari(hariIni, total.terdekat.tanggal) : 0

  return (
    <div className="lg">
      <div className="lg-head">
        <p className="lg-lede">
          Langganan yang kita bayar bareng. <span className="when-hover">Klik</span>
          <span className="when-touch">Ketuk</span> nama teman untuk menandai dia sudah bayar periode ini.
        </p>
        <button type="button" className="button button-primary" onClick={() => setMenambah(true)} disabled={menambah}>
          Tambah langganan
        </button>
      </div>

      <dl className="lg-stats">
        <div>
          <dt>Total per bulan</dt>
          <dd>{rupiah(total.perBulan)}</dd>
        </div>
        <div>
          <dt>Belum bayar</dt>
          <dd>{total.belumBayar} tagihan</dd>
        </div>
        <div>
          <dt>Jatuh tempo terdekat</dt>
          {total.terdekat ? (
            <dd>
              {total.terdekat.item.layanan}, {tanggalPendek(total.terdekat.tanggal)}
              <span className="lg-tempo lg-stat-note" data-state={keadaanTanggal(sisaTerdekat)}>
                {sisaHari(sisaTerdekat)}
              </span>
            </dd>
          ) : (
            <dd>Belum ada</dd>
          )}
        </div>
      </dl>

      {menambah && (
        <FormLangganan
          hariIni={hariIni}
          onBatal={() => setMenambah(false)}
          onSimpan={(baru) => {
            tambah(baru)
            setMenambah(false)
          }}
        />
      )}

      {items.length === 0 ? (
        <p className="lg-empty">Belum ada langganan. Tambahkan yang kalian bayar bareng, misalnya Netflix atau Spotify.</p>
      ) : (
        <ul className="lg-list">
          {urut.map((item) => (
            <Baris key={item.id} item={item} hariIni={hariIni} onBayar={tandaiBayar} onHapus={hapus} />
          ))}
        </ul>
      )}

      {!tersimpan && (
        <p className="form-error">Perubahan belum tersimpan karena browser ini tidak mengizinkan penyimpanan.</p>
      )}
      <p className="form-note">
        Untuk sementara data langganan disimpan di browser ini saja. Setelah tersambung ke Firebase, semua anggota
        melihat data yang sama.
      </p>
    </div>
  )
}

/** Warna tanggal: merah kalau sudah lewat, kuning kalau tinggal 3 hari atau kurang. */
const keadaanTanggal = (selisih: number) => (selisih < 0 ? 'telat' : selisih <= 3 ? 'dekat' : 'normal')

function Baris({
  item,
  hariIni,
  onBayar,
  onHapus,
}: {
  item: Item
  hariIni: Date
  onBayar: (id: string, nama: string, kunci: string) => void
  onHapus: (id: string) => void
}) {
  const [konfirmasi, setKonfirmasi] = useState(false)
  const k = keadaan(item, hariIni)
  const { perOrang } = porsi(item)
  const selisih = selisihHari(hariIni, k.periode.jatuhTempo)
  const keadaanTempo = k.lunasSemua ? 'lunas' : keadaanTanggal(selisih)
  const teksTempo = k.lunasSemua
    ? `Lunas, berikutnya ${tanggalPendek(k.periode.berikutnya)}`
    : `Jatuh tempo ${tanggalPendek(k.periode.jatuhTempo)}, ${sisaHari(selisih)}`

  return (
    <li className="lg-row" style={{ '--warna': item.warna } as CSSProperties}>
      <div className="lg-title">
        <h3 className="lg-name">
          <span className="lg-dot" aria-hidden="true" />
          {item.layanan}
        </h3>
        {item.contoh && <span className="chip">Contoh</span>}
      </div>

      <p className="lg-price">
        {rupiah(item.harga)}
        <span>/{labelSiklus[item.siklus]}</span>
      </p>

      <p className="lg-meta">
        <span>{item.anggota.length > 1 ? `${rupiah(perOrang)} per orang` : 'Langganan pribadi'}</span>
        <span className="lg-tempo" data-state={keadaanTempo}>
          {teksTempo}
        </span>
      </p>

      <ul className="lg-members" aria-label={`Yang ikut ${item.layanan}`}>
        {item.anggota.map((nama) => {
          const status = statusAnggota(item, nama, k.periode, hariIni)
          if (status === 'pemilik') {
            return (
              <li key={nama}>
                <span className="member member-pemilik">
                  {nama}
                  <span className="member-note">pemilik</span>
                </span>
              </li>
            )
          }
          const keterangan = status === 'lunas' ? 'sudah bayar' : status === 'telat' ? 'telat bayar' : 'belum bayar'
          return (
            <li key={nama}>
              <button
                type="button"
                className="member"
                data-status={status}
                aria-pressed={status === 'lunas'}
                aria-label={`${nama}, ${keterangan}`}
                onClick={() => onBayar(item.id, nama, k.periode.kunci)}
              >
                {status === 'lunas' && <CheckIcon />}
                {nama}
              </button>
            </li>
          )
        })}
      </ul>

      <div className="lg-actions">
        {k.penagihan.length > 0 && (
          <p className="lg-progress">
            {k.sudahBayar}/{k.penagihan.length} sudah bayar ke {item.pemilik}
          </p>
        )}
        {konfirmasi ? (
          <div className="lg-confirm">
            <span>Hapus {item.layanan}?</span>
            <button type="button" className="button button-danger button-small" onClick={() => onHapus(item.id)}>
              Hapus
            </button>
            <button type="button" className="button button-quiet button-small" onClick={() => setKonfirmasi(false)}>
              Batal
            </button>
          </div>
        ) : (
          <button type="button" className="text-button" onClick={() => setKonfirmasi(true)}>
            Hapus
          </button>
        )}
      </div>
    </li>
  )
}

const LAINNYA = 'Lainnya'
const bulanPanjang = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })

function FormLangganan({
  hariIni,
  onBatal,
  onSimpan,
}: {
  hariIni: Date
  onBatal: () => void
  onSimpan: (baru: LanggananBaru) => void
}) {
  const id = useId()
  const semua = circle.members.map((m) => m.name)
  const [pilihan, setPilihan] = useState<string>(DAFTAR_LAYANAN[0].nama)
  const [namaLain, setNamaLain] = useState('')
  const [harga, setHarga] = useState('')
  const [siklus, setSiklus] = useState<Siklus>(1)
  const [tanggal, setTanggal] = useState(hariIni.getDate())
  const [pemilik, setPemilik] = useState(semua[0] ?? '')
  const [anggota, setAnggota] = useState<string[]>(semua)

  const pertama = bulanTagihanPertama(tanggal, hariIni)
  const [bulanTagihan, setBulanTagihan] = useState(pertama)
  const bulanDipakai = siklus === 1 ? pertama : Math.max(bulanTagihan, pertama)

  const layanan = pilihan === LAINNYA ? namaLain.trim() : pilihan
  const nilai = Number(harga) || 0
  const ikut = semua.filter((nama) => nama === pemilik || anggota.includes(nama))
  const perOrang = Math.floor(nilai / Math.max(1, ikut.length))
  const kurang = [!layanan && 'nama layanan', nilai <= 0 && 'harga'].filter(Boolean)

  const toggleAnggota = (nama: string) =>
    setAnggota((list) => (list.includes(nama) ? list.filter((n) => n !== nama) : [...list, nama]))

  function submit(event: FormEvent) {
    event.preventDefault()
    if (kurang.length > 0) return
    onSimpan({
      layanan,
      warna: warnaLayanan(layanan),
      harga: nilai,
      siklus,
      tanggal,
      mulai: kunciBulan(bulanDipakai),
      pemilik,
      anggota: ikut,
    })
  }

  return (
    <form className="lg-form" onSubmit={submit} aria-labelledby={`${id}-judul`}>
      <h3 id={`${id}-judul`} className="lg-form-title">
        Langganan baru
      </h3>

      <div className="lg-form-grid">
        <label className="field" htmlFor={`${id}-layanan`}>
          <span className="field-label">Layanan</span>
          <select id={`${id}-layanan`} value={pilihan} onChange={(e) => setPilihan(e.target.value)}>
            {DAFTAR_LAYANAN.map((l) => (
              <option key={l.nama} value={l.nama}>
                {l.nama}
              </option>
            ))}
            <option value={LAINNYA}>Lainnya (isi sendiri)</option>
          </select>
        </label>

        {pilihan === LAINNYA && (
          <label className="field" htmlFor={`${id}-nama`}>
            <span className="field-label">Nama layanan</span>
            <input
              id={`${id}-nama`}
              value={namaLain}
              onChange={(e) => setNamaLain(e.target.value)}
              maxLength={40}
              placeholder="Misal: Apple Music"
              autoComplete="off"
            />
          </label>
        )}

        <label className="field" htmlFor={`${id}-harga`}>
          <span className="field-label">Harga total</span>
          <span className="lg-money">
            <span aria-hidden="true">Rp</span>
            <input
              id={`${id}-harga`}
              inputMode="numeric"
              value={nilai ? angka(nilai) : ''}
              onChange={(e) => setHarga(e.target.value.replace(/\D/g, '').slice(0, 9))}
              placeholder="186.000"
              autoComplete="off"
            />
          </span>
        </label>

        <label className="field" htmlFor={`${id}-siklus`}>
          <span className="field-label">Siklus</span>
          <select id={`${id}-siklus`} value={siklus} onChange={(e) => setSiklus(Number(e.target.value) as Siklus)}>
            <option value={1}>Bulanan</option>
            <option value={3}>3 bulanan</option>
            <option value={12}>Tahunan</option>
          </select>
        </label>

        <label className="field" htmlFor={`${id}-tanggal`}>
          <span className="field-label">Jatuh tempo tanggal</span>
          <select id={`${id}-tanggal`} value={tanggal} onChange={(e) => setTanggal(Number(e.target.value))}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>

        {siklus !== 1 && (
          <label className="field" htmlFor={`${id}-bulan`}>
            <span className="field-label">Tagihan berikutnya</span>
            <select id={`${id}-bulan`} value={bulanDipakai} onChange={(e) => setBulanTagihan(Number(e.target.value))}>
              {Array.from({ length: siklus }, (_, i) => pertama + i).map((indeks) => (
                <option key={indeks} value={indeks}>
                  {bulanPanjang.format(new Date(Math.floor(indeks / 12), indeks % 12, 1))}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="field" htmlFor={`${id}-pemilik`}>
          <span className="field-label">Pemilik akun</span>
          <select id={`${id}-pemilik`} value={pemilik} onChange={(e) => setPemilik(e.target.value)}>
            {semua.map((nama) => (
              <option key={nama} value={nama}>
                {nama}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="lg-fieldset">
        <legend className="field-label">Yang ikut patungan</legend>
        <ul className="lg-members">
          {semua.map((nama) => {
            const isPemilik = nama === pemilik
            const dipilih = isPemilik || anggota.includes(nama)
            return (
              <li key={nama}>
                <button
                  type="button"
                  className="member"
                  data-status={dipilih ? 'lunas' : 'belum'}
                  aria-pressed={dipilih}
                  disabled={isPemilik}
                  onClick={() => toggleAnggota(nama)}
                >
                  {dipilih && <CheckIcon />}
                  {nama}
                  {isPemilik && <span className="member-note">pemilik</span>}
                </button>
              </li>
            )
          })}
        </ul>
      </fieldset>

      <p className="lg-form-summary">
        {kurang.length > 0
          ? `Masih perlu: ${kurang.join(', ')}.`
          : ikut.length > 1
            ? `${rupiah(perOrang)} per orang, dibagi rata ${ikut.length} orang.`
            : 'Hanya pemilik akun, jadi dicatat sebagai langganan pribadi.'}
      </p>

      <div className="actions">
        <button type="submit" className="button button-primary" disabled={kurang.length > 0}>
          Simpan langganan
        </button>
        <button type="button" className="button button-quiet" onClick={onBatal}>
          Batal
        </button>
      </div>
    </form>
  )
}

function CheckIcon() {
  return (
    <svg
      width="0.95em"
      height="0.95em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}
