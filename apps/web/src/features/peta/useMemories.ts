import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { contohKenangan } from './data/contoh'
import { byNewest } from './format'
import { cityFor } from './geocode'
import type { PreparedPhoto } from './photos'
import { deleteStoredMemory, listStoredMemories, saveStoredMemory, type StoredMemory } from './storage'
import type { Memory, Spot } from './types'

export type NewMemory = {
  judul: string
  tanggal?: string
  cerita?: string
  kota?: string
  spot: Spot
  photos: PreparedPhoto[]
}

const newId = () =>
  typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

/** Mengubah data dari IndexedDB jadi Memory dengan URL foto yang bisa dipakai <img>. */
function fromStored(stored: StoredMemory, urls: Map<string, string[]>): Memory {
  const created: string[] = []
  const url = (blob: Blob) => {
    const u = URL.createObjectURL(blob)
    created.push(u)
    return u
  }
  const memory: Memory = {
    id: stored.id,
    judul: stored.judul,
    tanggal: stored.tanggal,
    cerita: stored.cerita,
    kota: stored.kota,
    lat: stored.lat,
    lng: stored.lng,
    foto: stored.foto.map((f) => ({ src: url(f.full), thumb: url(f.thumb), width: f.width, height: f.height })),
    asal: 'lokal',
    dibuat: stored.dibuat,
  }
  urls.set(stored.id, created)
  return memory
}

/**
 * Semua kenangan di peta: contoh dari kode + yang ditambahkan lewat browser ini.
 * Saat Firebase sudah siap, cukup isi hook ini yang diganti.
 */
export function useMemories() {
  const [local, setLocal] = useState<Memory[]>([])
  const [storageReady, setStorageReady] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const urls = useRef(new Map<string, string[]>())

  useEffect(() => {
    let cancelled = false
    const created = urls.current

    // Kenangan lama yang belum punya nama kota: dicarikan dari lokasinya, lalu disimpan.
    const fillMissingCities = async (records: StoredMemory[]) => {
      for (const record of records) {
        if (cancelled) return
        if (record.kota) continue
        const kota = await cityFor({ lat: record.lat, lng: record.lng })
        if (cancelled || !kota) continue
        try {
          await saveStoredMemory({ ...record, kota })
        } catch {
          continue
        }
        setLocal((list) => list.map((m) => (m.id === record.id ? { ...m, kota } : m)))
      }
    }

    listStoredMemories()
      .then((stored) => {
        if (cancelled) return
        setLocal(stored.map((s) => fromStored(s, created)))
        setLoaded(true)
        void fillMissingCities(stored)
      })
      .catch(() => {
        if (cancelled) return
        setStorageReady(false)
        setLoaded(true)
      })
    return () => {
      cancelled = true
      for (const list of created.values()) list.forEach((u) => URL.revokeObjectURL(u))
      created.clear()
    }
  }, [])

  const add = useCallback(async (input: NewMemory) => {
    const stored: StoredMemory = {
      id: newId(),
      judul: input.judul.trim(),
      tanggal: input.tanggal || undefined,
      cerita: input.cerita?.trim() || undefined,
      kota: input.kota?.trim() || undefined,
      lat: input.spot.lat,
      lng: input.spot.lng,
      foto: input.photos.map((p) => ({ full: p.full, thumb: p.thumb, width: p.width, height: p.height })),
      dibuat: Date.now(),
    }
    await saveStoredMemory(stored)
    const memory = fromStored(stored, urls.current)
    setLocal((list) => [...list, memory])
    return memory
  }, [])

  const remove = useCallback(async (id: string) => {
    await deleteStoredMemory(id)
    urls.current.get(id)?.forEach((u) => URL.revokeObjectURL(u))
    urls.current.delete(id)
    setLocal((list) => list.filter((m) => m.id !== id))
  }, [])

  const memories = useMemo(() => [...contohKenangan, ...local].sort(byNewest), [local])

  return { memories, loaded, add, remove, storageReady }
}

export type MemoriesStore = ReturnType<typeof useMemories>
