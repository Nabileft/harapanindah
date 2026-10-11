import type { CSSProperties } from 'react'
import { rupiah, tanggalPendek } from './format'
import { keadaan, porsi, urutkan } from './periode'
import type { Langganan } from './types'

/** Gambar pratinjau saat judul "Langganan" di-hover: sampul langganan yang paling dekat jatuh temponya. */
export function SampulLangganan({ items, hariIni }: { items: Langganan[]; hariIni: Date }) {
  const utama = urutkan(items, hariIni)[0]

  if (!utama) {
    return (
      <div className="sampul">
        <p className="sampul-atas">Langganan bareng</p>
        <p className="sampul-nama">Belum ada</p>
      </div>
    )
  }

  const k = keadaan(utama, hariIni)
  const { perOrang } = porsi(utama)
  const status = k.lunasSemua
    ? `Lunas sampai ${tanggalPendek(k.periode.berikutnya)}`
    : `${k.sudahBayar}/${k.penagihan.length} sudah bayar, jatuh tempo ${tanggalPendek(k.periode.jatuhTempo)}`

  return (
    <div className="sampul" style={{ '--warna': utama.warna } as CSSProperties}>
      <p className="sampul-atas">
        <span>Langganan bareng</span>
        {items.length > 1 && <span>+{items.length - 1} lainnya</span>}
      </p>
      <div>
        <p className="sampul-nama">{utama.layanan}</p>
        <p className="sampul-info">
          {utama.anggota.length} orang, {rupiah(perOrang)} per orang
        </p>
        <p className="sampul-info">{status}</p>
      </div>
    </div>
  )
}
