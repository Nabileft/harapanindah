import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { folderKey, folderSummary, groupByCity, OTHER_KEY, type CityFolder } from './cities'
import { formatTanggal } from './format'
import { PrevIcon } from './icons'
import { Lightbox } from './Lightbox'
import { MemoryDetail } from './MemoryDetail'
import { MemoryForm } from './MemoryForm'
import { muatPeta } from './muatPeta'
import type { DraftSpot, Memory, Spot } from './types'
import { useInView } from './useInView'
import type { MemoriesStore, NewMemory } from './useMemories'
import './PetaJejak.css'

// Library peta cukup besar, jadi baru dimuat saat section ini hampir terlihat.
const MemoryMap = lazy(muatPeta)

type Mode = 'browse' | 'add'

/**
 * Isi fitur "Jejak Kita". Judulnya ada di daftar fitur; data kenangan juga diambil di sana.
 * `siap` false selama animasi membuka berjalan: peta baru dipasang setelahnya, supaya animasinya tidak tersendat.
 */
export function PetaJejak({ store, siap = true }: { store: MemoriesStore; siap?: boolean }) {
  const { memories, loaded, add, remove, storageReady } = store
  const [stageRef, inView] = useInView<HTMLDivElement>()
  const [mode, setMode] = useState<Mode>('browse')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [openCity, setOpenCity] = useState<string | null>(null)
  const [draft, setDraft] = useState<DraftSpot | null>(null)
  const [draftThumb, setDraftThumb] = useState<string | null>(null)
  const [viewer, setViewer] = useState<{ id: string; index: number } | null>(null)
  const stripRef = useRef<HTMLOListElement>(null)

  const folders = useMemo(() => groupByCity(memories), [memories])
  const openFolder = openCity ? folders.find((f) => f.key === openCity) : undefined
  // Folder yang dibuka menyaring pin di peta ke kota itu saja.
  const visible = openFolder ? openFolder.memories : memories
  const kotaSuggestions = useMemo(() => folders.filter((f) => f.key !== OTHER_KEY).map((f) => f.name), [folders])

  const selected = visible.find((m) => m.id === selectedId) ?? null
  const viewing = viewer ? memories.find((m) => m.id === viewer.id) : undefined
  const panelOpen = mode === 'add' || selected !== null

  const select = (id: string | null) => setSelectedId(id)

  const openFolderOf = (key: string | null) => {
    setSelectedId(null)
    setOpenCity(key)
  }

  const startAdding = () => {
    setSelectedId(null)
    setDraft(null)
    setDraftThumb(null)
    setMode('add')
  }

  // Saat mulai menambah kenangan atau memilih kenangan, pastikan peta terlihat utuh.
  // Dijalankan setelah render (bukan langsung di handler klik) supaya scroll-nya tidak dibatalkan browser.
  useEffect(() => {
    if (mode === 'add' || selectedId) stageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [mode, selectedId, stageRef])

  const stopAdding = () => {
    setMode('browse')
    setDraft(null)
    setDraftThumb(null)
  }

  const save = async (input: NewMemory) => {
    const memory = await add(input)
    stopAdding()
    // Buka folder kota kenangan baru, supaya kelihatan masuk ke mana.
    setOpenCity(folderKey(memory.kota))
    setSelectedId(memory.id)
  }

  const onPick = useCallback((spot: Spot) => setDraft({ spot, fromPhoto: false }), [])
  const onSpotFromPhoto = useCallback((spot: Spot) => setDraft({ spot, fromPhoto: true }), [])

  // Kartu kenangan yang dipilih digeser ke dalam layar di deretan bawah peta.
  useEffect(() => {
    const strip = stripRef.current
    const card = selectedId ? strip?.querySelector<HTMLElement>(`[data-id="${CSS.escape(selectedId)}"]`) : null
    if (!strip || !card) return
    const left = card.offsetLeft
    const right = left + card.offsetWidth
    if (left < strip.scrollLeft || right > strip.scrollLeft + strip.clientWidth) {
      strip.scrollTo({ left: Math.max(0, left - 16), behavior: 'smooth' })
    }
  }, [selectedId, openCity])

  // Esc menutup panel detail (lightbox punya penanganan sendiri).
  useEffect(() => {
    if (!selectedId || viewer) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedId(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, viewer])

  return (
    <div className="peta">
      <div className="peta-head">
        <p className="peta-lede">
          Tempat-tempat yang pernah kita datangi bareng. <span className="when-hover">Klik</span>
          <span className="when-touch">Ketuk</span> foto di peta untuk melihat ceritanya.
        </p>
        <button type="button" className="button button-primary" onClick={startAdding} disabled={mode === 'add'}>
          Tambah kenangan
        </button>
      </div>

      <div ref={stageRef} className="peta-stage" data-mode={mode} data-panel={panelOpen}>
        {inView && siap ? (
          <Suspense fallback={<MapPlaceholder />}>
            <MemoryMap
              memories={visible}
              ready={loaded}
              selectedId={selectedId}
              onSelect={select}
              mode={mode}
              panelOpen={panelOpen}
              draft={draft}
              draftThumb={draftThumb}
              onPick={onPick}
              fitKey={openFolder?.key ?? 'semua'}
              fitLabel={openFolder ? `Lihat semua di ${openFolder.name}` : 'Lihat semua'}
            />
          </Suspense>
        ) : (
          <MapPlaceholder />
        )}

        {mode === 'browse' && loaded && memories.length === 0 && (
          <div className="peta-empty">
            <p className="peta-empty-title">Belum ada kenangan di peta.</p>
            <p>Taruh foto pertama kalian di tempat kalian pernah main.</p>
            <button type="button" className="button button-primary" onClick={startAdding}>
              Tambah kenangan
            </button>
          </div>
        )}

        {mode === 'browse' && selected && (
          <MemoryDetail
            key={selected.id}
            memory={selected}
            onClose={() => setSelectedId(null)}
            onOpenPhoto={(index) => setViewer({ id: selected.id, index })}
            onDelete={async () => {
              await remove(selected.id)
              setSelectedId(null)
              if (openFolder && openFolder.memories.length <= 1) setOpenCity(null)
            }}
          />
        )}

        {mode === 'add' && (
          <MemoryForm
            draft={draft}
            onSpotFromPhoto={onSpotFromPhoto}
            onThumb={setDraftThumb}
            onCancel={stopAdding}
            onSave={save}
            storageReady={storageReady}
            kotaSuggestions={kotaSuggestions}
          />
        )}
      </div>

      {memories.length > 0 &&
        (openFolder ? (
          <div className="peta-below">
            <div className="folder-head">
              <button type="button" className="button button-quiet button-small" onClick={() => openFolderOf(null)}>
                <PrevIcon />
                Semua kota
              </button>
              <h3 className="folder-head-title">{openFolder.name}</h3>
              <p className="folder-meta">{folderSummary(openFolder)}</p>
            </div>
            <ol ref={stripRef} className="peta-strip" aria-label={`Kenangan di ${openFolder.name}`}>
              {openFolder.memories.map((memory) => (
                <li key={memory.id} data-id={memory.id}>
                  <MemoryCard
                    memory={memory}
                    selected={memory.id === selectedId}
                    disabled={mode === 'add'}
                    onSelect={() => select(memory.id)}
                  />
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <div className="peta-below">
            <h3 className="peta-below-title">Kenangan per kota</h3>
            <ol className="peta-strip" aria-label="Folder kota">
              {folders.map((folder) => (
                <li key={folder.key}>
                  <FolderCard folder={folder} disabled={mode === 'add'} onOpen={() => openFolderOf(folder.key)} />
                </li>
              ))}
            </ol>
          </div>
        ))}

      {viewing && viewer && (
        <Lightbox
          memory={viewing}
          index={viewer.index}
          onIndex={(index) => setViewer({ id: viewing.id, index })}
          onClose={() => setViewer(null)}
        />
      )}
    </div>
  )
}

/** Folder kota, gaya album di Galeri iPhone: satu foto sampul, nama kota, jumlah foto. */
function FolderCard({ folder, disabled, onOpen }: { folder: CityFolder; disabled: boolean; onOpen: () => void }) {
  const cover = folder.memories.find((m) => m.foto.length > 0)?.foto[0]
  return (
    <button
      type="button"
      className="folder-card"
      disabled={disabled}
      onClick={onOpen}
      aria-label={`${folder.name}, ${folderSummary(folder)}`}
    >
      <span className="folder-cover" aria-hidden="true">
        {cover && <img src={cover.thumb} alt="" loading="lazy" />}
      </span>
      <span className="folder-name">{folder.name}</span>
      <span className="folder-count">{folder.photoCount}</span>
    </button>
  )
}

function MemoryCard({
  memory,
  selected,
  disabled,
  onSelect,
}: {
  memory: Memory
  selected: boolean
  disabled: boolean
  onSelect: () => void
}) {
  return (
    <button type="button" className="strip-card" aria-pressed={selected} disabled={disabled} onClick={onSelect}>
      <span className="strip-photo">
        {memory.foto[0] && <img src={memory.foto[0].thumb} alt="" loading="lazy" />}
        {memory.asal === 'contoh' && <span className="chip chip-on-photo">Contoh</span>}
        {memory.foto.length > 1 && <span className="strip-count">{memory.foto.length} foto</span>}
      </span>
      <span className="strip-title">{memory.judul}</span>
      <span className="strip-date">{formatTanggal(memory.tanggal)}</span>
    </button>
  )
}

function MapPlaceholder() {
  return (
    <div className="map-placeholder">
      <p>Memuat peta…</p>
    </div>
  )
}
