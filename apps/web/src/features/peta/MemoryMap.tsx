import 'maplibre-gl/dist/maplibre-gl.css'
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  setWorkerUrl,
  type MapMouseEvent,
  type PaddingOptions,
} from 'maplibre-gl'
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { formatTanggal, tiltFor } from './format'
import { nightStyle } from './mapStyle'
import type { DraftSpot, Memory, Spot } from './types'

// Worker MapLibre di-bundle oleh Vite, lalu alamatnya diberikan ke MapLibre.
setWorkerUrl(workerUrl)

/** Tampilan awal kalau belum ada kenangan: sekitar Harapan Indah, Bekasi. */
const DEFAULT_VIEW = { center: [106.97, -6.18] as [number, number], zoom: 10 }

const LOCALE = {
  'AttributionControl.ToggleAttribution': 'Tampilkan sumber peta',
  'Map.Title': 'Peta kenangan',
  'Marker.Title': 'Penanda',
  'NavigationControl.ZoomIn': 'Perbesar',
  'NavigationControl.ZoomOut': 'Perkecil',
  'NavigationControl.ResetBearing': 'Hadapkan ke utara',
  'CooperativeGesturesHandler.WindowsHelpText': 'Tahan Ctrl sambil scroll untuk memperbesar peta',
  'CooperativeGesturesHandler.MacHelpText': 'Tahan ⌘ sambil scroll untuk memperbesar peta',
  'CooperativeGesturesHandler.MobileHelpText': 'Pakai dua jari untuk menggeser peta',
}

type Props = {
  memories: Memory[]
  /** true setelah kenangan dari browser selesai dimuat, supaya peta langsung memperlihatkan semuanya. */
  ready: boolean
  selectedId: string | null
  onSelect: (id: string | null) => void
  mode: 'browse' | 'add'
  panelOpen: boolean
  draft: DraftSpot | null
  draftThumb: string | null
  onPick: (spot: Spot) => void
  /** Berubah saat folder kota dibuka/ditutup: peta menyesuaikan ke kenangan yang tampil. */
  fitKey: string
  /** Teks tombol untuk memperlihatkan semua pin yang tampil. */
  fitLabel: string
}

const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Ruang kosong di tepi peta supaya pin tidak tertutup panel (samping di layar lebar, bawah di HP). */
function paddingFor(container: HTMLElement, panelOpen: boolean): PaddingOptions {
  const width = container.clientWidth
  const height = container.clientHeight
  if (!panelOpen) return { top: 72, right: 56, bottom: 56, left: 56 }
  if (width >= 768) return { top: 72, right: Math.min(380, width * 0.45) + 56, bottom: 56, left: 56 }
  return { top: 72, right: 32, bottom: Math.round(height * 0.62) + 24, left: 32 }
}

function fitAll(map: MapLibreMap, memories: Memory[], panelOpen: boolean, animate: boolean) {
  if (memories.length === 0) {
    map.jumpTo(DEFAULT_VIEW)
    return
  }
  const bounds = new LngLatBounds()
  for (const m of memories) bounds.extend([m.lng, m.lat])
  map.fitBounds(bounds, {
    padding: paddingFor(map.getContainer(), panelOpen),
    maxZoom: 12,
    duration: animate && !prefersReducedMotion() ? 900 : 0,
  })
}

/** Menyimpan nilai terbaru tanpa membuat efek dijalankan ulang. */
function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}

export default function MemoryMap(props: Props) {
  const { memories, ready, selectedId, onSelect, mode, panelOpen, draft, draftThumb, fitKey, fitLabel } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<MapLibreMap | null>(null)
  const [failed, setFailed] = useState(false)
  const fitted = useRef(false)
  const latest = useLatest(props)

  // Membuat peta sekali.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const instance = new MapLibreMap({
      container,
      style: nightStyle,
      ...DEFAULT_VIEW,
      maxZoom: 18,
      attributionControl: { compact: true },
      cooperativeGestures: true,
      dragRotate: false,
      pitchWithRotate: false,
      touchPitch: false,
      locale: LOCALE,
    })
    instance.touchZoomRotate.disableRotation()
    instance.keyboard.disableRotation()
    instance.addControl(new NavigationControl({ showCompass: false }), 'bottom-left')

    let loaded = false
    instance.on('load', () => {
      loaded = true
      setFailed(false)
    })
    instance.on('error', () => {
      if (!loaded) setFailed(true)
    })
    instance.on('click', (event: MapMouseEvent) => {
      const target = event.originalEvent.target
      if (target instanceof Element && target.closest('.maplibregl-marker')) return
      if (latest.current.mode === 'add') latest.current.onPick({ lng: event.lngLat.lng, lat: event.lngLat.lat })
      else latest.current.onSelect(null)
    })

    setMap(instance)
    return () => {
      instance.remove()
      setMap(null)
    }
  }, [latest])

  // Pertama kali: perlihatkan semua kenangan.
  useEffect(() => {
    if (!map || !ready || fitted.current) return
    fitted.current = true
    fitAll(map, latest.current.memories, false, false)
  }, [map, ready, latest])

  // Folder kota dibuka/ditutup: tampilkan semua kenangan yang terlihat.
  const lastFitKey = useRef(fitKey)
  useEffect(() => {
    if (!map || lastFitKey.current === fitKey) return
    lastFitKey.current = fitKey
    fitAll(map, latest.current.memories, latest.current.panelOpen, true)
  }, [map, fitKey, latest])

  // Terbang ke kenangan yang dipilih (setelah efek di atas, supaya pilihan ini yang menang).
  useEffect(() => {
    if (!map || !selectedId) return
    const memory = latest.current.memories.find((m) => m.id === selectedId)
    if (!memory) return
    map.flyTo({
      center: [memory.lng, memory.lat],
      zoom: Math.max(map.getZoom(), 12.5),
      padding: paddingFor(map.getContainer(), true),
      duration: prefersReducedMotion() ? 0 : 1100,
      essential: true,
    })
  }, [map, selectedId, latest])

  // Lokasi dari foto: arahkan peta ke sana.
  useEffect(() => {
    if (!map || !draft?.fromPhoto) return
    map.flyTo({
      center: [draft.spot.lng, draft.spot.lat],
      zoom: Math.max(map.getZoom(), 13),
      padding: paddingFor(map.getContainer(), true),
      duration: prefersReducedMotion() ? 0 : 1100,
      essential: true,
    })
  }, [map, draft])

  // Saat menambah kenangan, peta bisa langsung digeser/di-zoom tanpa tombol tambahan.
  useEffect(() => {
    if (!map) return
    if (mode === 'add') map.cooperativeGestures.disable()
    else map.cooperativeGestures.enable()
  }, [map, mode])

  return (
    <>
      <div ref={containerRef} className="map-canvas" />

      {map &&
        memories.map((memory) => (
          <MapMarker key={memory.id} map={map} spot={memory} zIndex={memory.id === selectedId ? 3 : 1}>
            <PhotoPin
              memory={memory}
              selected={memory.id === selectedId}
              onSelect={() => onSelect(memory.id)}
            />
          </MapMarker>
        ))}

      {map && mode === 'add' && draft && (
        <MapMarker map={map} spot={draft.spot} zIndex={4}>
          <DraftPin thumb={draftThumb} />
        </MapMarker>
      )}

      {map && mode === 'browse' && memories.length > 1 && (
        <button type="button" className="map-button map-fit" onClick={() => fitAll(map, memories, panelOpen, true)}>
          {fitLabel}
        </button>
      )}

      {mode === 'add' && !draft && (
        <p className="map-hint" role="status">
          <span className="when-hover">Klik</span>
          <span className="when-touch">Ketuk</span> peta untuk menaruh lokasinya
        </p>
      )}

      {failed && (
        <p className="map-message" role="alert">
          Peta tidak bisa dimuat. Periksa koneksi internet, lalu muat ulang halaman.
        </p>
      )}
    </>
  )
}

/** Menaruh elemen React di atas peta pada koordinat tertentu. */
function MapMarker({ map, spot, zIndex, children }: { map: MapLibreMap; spot: Spot; zIndex: number; children: ReactNode }) {
  const [element] = useState(() => document.createElement('div'))
  const marker = useRef<Marker | null>(null)
  const { lng, lat } = spot

  useEffect(() => {
    const instance = new Marker({ element, anchor: 'bottom', offset: [0, 4] }).setLngLat([lng, lat]).addTo(map)
    marker.current = instance
    return () => {
      instance.remove()
      marker.current = null
    }
    // Posisi awal saja; perpindahan ditangani efek di bawah supaya penanda tidak dibuat ulang.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, element])

  useEffect(() => {
    marker.current?.setLngLat([lng, lat])
  }, [lng, lat])

  useEffect(() => {
    element.style.zIndex = String(zIndex)
  }, [element, zIndex])

  return createPortal(children, element)
}

function PhotoPin({ memory, selected, onSelect }: { memory: Memory; selected: boolean; onSelect: () => void }) {
  const cover = memory.foto[0]
  return (
    <button
      type="button"
      className="pin"
      aria-pressed={selected}
      aria-label={`${memory.judul}, ${formatTanggal(memory.tanggal)}`}
      style={{ '--tilt': `${tiltFor(memory.id)}deg` } as CSSProperties}
      onClick={onSelect}
    >
      <span className="pin-label" aria-hidden="true">
        {memory.judul}
      </span>
      <span className="pin-photo" data-stack={memory.foto.length > 1 || undefined}>
        <span className="pin-print">{cover && <img src={cover.thumb} alt="" draggable={false} />}</span>
      </span>
      <span className="pin-stem" aria-hidden="true" />
    </button>
  )
}

function DraftPin({ thumb }: { thumb: string | null }) {
  return (
    <div className="pin pin-draft" aria-hidden="true">
      {thumb && (
        <span className="pin-photo">
          <span className="pin-print">
            <img src={thumb} alt="" draggable={false} />
          </span>
        </span>
      )}
      <span className="pin-stem" />
    </div>
  )
}
