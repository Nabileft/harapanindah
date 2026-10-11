import { useCallback, useRef, useState } from 'react'
import { contohLangganan } from './data/contoh'
import { muatLangganan, muatLanggananLama, simpanLangganan } from './storage'
import type { Langganan, Siklus } from './types'

export type LanggananBaru = {
  layanan: string
  warna: string
  harga: number
  siklus: Siklus
  tanggal: number
  mulai: string
  pemilik: string
  anggota: string[]
}

const idBaru = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Yang tersimpan, atau (saat pertama dibuka) contoh Apple Music + langganan asli dari versi sebelumnya. */
function dataAwal(): Langganan[] {
  const tersimpan = muatLangganan()
  if (tersimpan) return tersimpan
  const asli = (muatLanggananLama() ?? []).filter((item) => !item.contoh)
  const contoh = contohLangganan().filter((c) => !asli.some((item) => item.layanan === c.layanan))
  return [...contoh, ...asli]
}

/** Data langganan. Saat Firebase sudah siap, cukup isi hook ini yang diganti. */
export function useLangganan() {
  const [items, setItems] = useState<Langganan[]>(dataAwal)
  const [tersimpan, setTersimpan] = useState(true)
  const terakhir = useRef(items)

  // Setiap perubahan langsung disimpan ke browser.
  const ubah = useCallback((fn: (list: Langganan[]) => Langganan[]) => {
    const berikut = fn(terakhir.current)
    terakhir.current = berikut
    setItems(berikut)
    setTersimpan(simpanLangganan(berikut))
  }, [])

  const tambah = useCallback(
    (input: LanggananBaru) => {
      const item: Langganan = { ...input, id: idBaru(), lunas: {}, dibuat: Date.now() }
      ubah((list) => [...list, item])
      return item
    },
    [ubah],
  )

  const hapus = useCallback((id: string) => ubah((list) => list.filter((item) => item.id !== id)), [ubah])

  /** Tandai / batalkan "sudah bayar" untuk satu anggota di periode tertentu. */
  const tandaiBayar = useCallback(
    (id: string, nama: string, kunci: string) =>
      ubah((list) =>
        list.map((item) => {
          if (item.id !== id) return item
          const sekarang = item.lunas[kunci] ?? []
          const berikut = sekarang.includes(nama) ? sekarang.filter((n) => n !== nama) : [...sekarang, nama]
          return { ...item, lunas: { ...item.lunas, [kunci]: berikut } }
        }),
      ),
    [ubah],
  )

  return { items, tambah, hapus, tandaiBayar, tersimpan }
}

export type LanggananStore = ReturnType<typeof useLangganan>
