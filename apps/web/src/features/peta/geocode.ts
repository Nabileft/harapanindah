import type { Spot } from './types'

// Nama kota dari koordinat (reverse geocoding) memakai Nominatim OpenStreetMap: gratis, tanpa API key.
// Aturan pakainya: maksimal 1 permintaan per detik, jadi permintaan dijalankan antre dan hasilnya disimpan.
// Nanti saat backend siap, ini dipindah ke server (lihat spesifikasi: server/platform/geocoding).

const ENDPOINT = 'https://nominatim.openstreetmap.org/reverse'
const GAP_MS = 1100

type Address = Record<string, string | undefined>

const cache = new Map<string, Promise<string | null>>()
let queue: Promise<unknown> = Promise.resolve()

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/** Nama kota untuk titik ini, misalnya "Jakarta" atau "Bekasi". null kalau tidak ketemu atau sedang offline. */
export function cityFor({ lat, lng }: Spot): Promise<string | null> {
  const key = `${lat.toFixed(3)},${lng.toFixed(3)}`
  let result = cache.get(key)
  if (!result) {
    result = queue.then(() => lookup(lat, lng))
    queue = result.then(() => wait(GAP_MS))
    cache.set(key, result)
  }
  return result
}

async function lookup(lat: number, lng: number) {
  const params = new URLSearchParams({
    format: 'jsonv2',
    lat: String(lat),
    lon: String(lng),
    zoom: '10',
    addressdetails: '1',
    'accept-language': 'id',
  })
  try {
    const response = await fetch(`${ENDPOINT}?${params}`, { headers: { Accept: 'application/json' } })
    if (!response.ok) return null
    const data: { address?: Address } = await response.json()
    return cityFromAddress(data.address)
  } catch {
    return null
  }
}

/** Merapikan alamat jadi nama kota yang biasa dipakai sehari-hari. */
export function cityFromAddress(address?: Address): string | null {
  if (!address) return null
  // Jakarta terdiri dari beberapa kota administrasi (Jakarta Utara, Selatan, ...): cukup "Jakarta".
  if (address['ISO3166-2-lvl4'] === 'ID-JK' || /jakarta/i.test(address.state ?? '')) return 'Jakarta'
  const name =
    address.city ??
    address.town ??
    address.county ??
    address.municipality ??
    address.city_district ??
    address.state_district ??
    address.village ??
    address.state
  if (!name) return null
  return name.replace(/^(Kota Administrasi|Kota|Kabupaten|Kab\.)\s+/i, '').trim() || null
}
