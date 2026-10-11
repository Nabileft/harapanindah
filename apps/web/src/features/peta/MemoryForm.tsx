import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { toInputDate } from './format'
import { cityFor } from './geocode'
import { CloseIcon, PlusIcon } from './icons'
import { preparePhoto, readPhotoInfo, type PreparedPhoto } from './photos'
import type { DraftSpot, Spot } from './types'
import type { NewMemory } from './useMemories'

const MAX_PHOTOS = 10

type FormPhoto = { key: string; name: string; preview: string; prepared: PreparedPhoto }

type Props = {
  draft: DraftSpot | null
  onSpotFromPhoto: (spot: Spot) => void
  onThumb: (thumb: string | null) => void
  onCancel: () => void
  onSave: (memory: NewMemory) => Promise<void>
  storageReady: boolean
  /** Nama kota yang sudah ada, supaya penulisannya seragam. */
  kotaSuggestions: string[]
}

const isImage = (file: File) => file.type.startsWith('image/') || /\.(heic|heif)$/i.test(file.name)

export function MemoryForm({
  draft,
  onSpotFromPhoto,
  onThumb,
  onCancel,
  onSave,
  storageReady,
  kotaSuggestions,
}: Props) {
  const id = useId()
  const fileInput = useRef<HTMLInputElement>(null)
  const previews = useRef<string[]>([])
  const [photos, setPhotos] = useState<FormPhoto[]>([])
  const [progress, setProgress] = useState<string | null>(null)
  const [problems, setProblems] = useState<string[]>([])
  const [dragging, setDragging] = useState(false)
  const [judul, setJudul] = useState('')
  const [tanggal, setTanggal] = useState('')
  const [cerita, setCerita] = useState('')
  const [kota, setKota] = useState('')
  const [findingCity, setFindingCity] = useState(false)
  const kotaTyped = useRef(false)
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    const created = previews.current
    return () => created.forEach((url) => URL.revokeObjectURL(url))
  }, [])

  // Nama kota dicari otomatis dari lokasi, kecuali sudah diketik sendiri.
  useEffect(() => {
    if (!draft || kotaTyped.current) return
    let cancelled = false
    setFindingCity(true)
    cityFor(draft.spot).then((name) => {
      if (cancelled) return
      if (name && !kotaTyped.current) setKota(name)
      setFindingCity(false)
    })
    return () => {
      cancelled = true
    }
  }, [draft])

  const cover = photos[0]?.preview ?? null
  useEffect(() => {
    onThumb(cover)
  }, [cover, onThumb])

  async function addFiles(list: FileList | File[]) {
    const files = Array.from(list).filter(isImage)
    const room = MAX_PHOTOS - photos.length
    const chosen = files.slice(0, Math.max(0, room))
    const issues: string[] = []
    if (files.length > room) issues.push(`Maksimal ${MAX_PHOTOS} foto per kenangan.`)

    let hasSpot = draft !== null
    let hasDate = tanggal !== ''
    for (const [i, file] of chosen.entries()) {
      setProgress(`Menyiapkan foto ${i + 1} dari ${chosen.length}…`)
      try {
        const [prepared, info] = await Promise.all([preparePhoto(file), readPhotoInfo(file)])
        const preview = URL.createObjectURL(prepared.thumb)
        previews.current.push(preview)
        const key = `${file.name}-${file.lastModified}-${previews.current.length}`
        setPhotos((current) => [...current, { key, name: file.name, preview, prepared }])
        if (!hasSpot && info.spot) {
          hasSpot = true
          onSpotFromPhoto(info.spot)
        }
        if (!hasDate && info.tanggal) {
          hasDate = true
          setTanggal(info.tanggal)
        }
      } catch {
        issues.push(`${file.name} tidak bisa dibuka di browser ini. Coba pilih versi JPG atau PNG-nya.`)
      }
    }
    setProgress(null)
    setProblems(issues)
  }

  function removePhoto(key: string) {
    setPhotos((current) => current.filter((p) => p.key !== key))
  }

  function onDrop(event: DragEvent) {
    event.preventDefault()
    setDragging(false)
    if (event.dataTransfer.files.length) void addFiles(event.dataTransfer.files)
  }

  const missing = [
    photos.length === 0 && 'foto',
    draft === null && 'lokasi',
    judul.trim() === '' && 'judul',
  ].filter(Boolean)

  const canSave = missing.length === 0 && !saving && progress === null && storageReady

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (!canSave || !draft) return
    setSaving(true)
    setSaveFailed(false)
    try {
      await onSave({ judul, tanggal, cerita, kota, spot: draft.spot, photos: photos.map((p) => p.prepared) })
    } catch {
      setSaveFailed(true)
      setSaving(false)
    }
  }

  return (
    <form className="panel panel-form" onSubmit={submit} aria-labelledby={`${id}-judul`}>
      <div className="panel-head">
        <h3 id={`${id}-judul`} className="panel-title">
          Kenangan baru
        </h3>
        <button type="button" className="icon-button" onClick={onCancel} aria-label="Batal menambah kenangan">
          <CloseIcon />
        </button>
      </div>

      <div
        className="dropzone"
        data-dragging={dragging || undefined}
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        {photos.length === 0 ? (
          <>
            <button type="button" className="button button-primary" onClick={() => fileInput.current?.click()}>
              Pilih foto
            </button>
            <p className="hint">
              Kalau fotonya menyimpan lokasi dan tanggal, keduanya langsung terisi. Bisa juga seret foto ke sini.
            </p>
          </>
        ) : (
          <ul className="form-photos" aria-label="Foto yang dipilih">
            {photos.map((photo) => (
              <li key={photo.key}>
                <img src={photo.preview} alt="" />
                <button
                  type="button"
                  className="form-photo-remove"
                  aria-label={`Hapus ${photo.name}`}
                  onClick={() => removePhoto(photo.key)}
                >
                  <CloseIcon />
                </button>
              </li>
            ))}
            {photos.length < MAX_PHOTOS && (
              <li>
                <button type="button" className="form-photo-add" onClick={() => fileInput.current?.click()}>
                  <PlusIcon />
                  <span>Foto</span>
                </button>
              </li>
            )}
          </ul>
        )}
        <input
          ref={fileInput}
          id={`${id}-foto`}
          type="file"
          accept="image/*,.heic,.heif"
          multiple
          hidden
          onChange={(event) => {
            if (event.target.files?.length) void addFiles(event.target.files)
            event.target.value = ''
          }}
        />
        {progress && (
          <p className="hint" role="status">
            {progress}
          </p>
        )}
        {problems.map((problem) => (
          <p key={problem} className="form-error">
            {problem}
          </p>
        ))}
      </div>

      <p className="spot-status" data-set={draft !== null}>
        {draft === null ? (
          <>
            <span className="when-hover">Klik</span>
            <span className="when-touch">Ketuk</span> peta untuk menandai lokasinya.
          </>
        ) : draft.fromPhoto ? (
          <>
            Lokasi diambil dari foto. <span className="when-hover">Klik</span>
            <span className="when-touch">Ketuk</span> peta kalau mau memindahkannya.
          </>
        ) : (
          <>
            Lokasi sudah ditandai. <span className="when-hover">Klik</span>
            <span className="when-touch">Ketuk</span> peta lagi untuk memindahkannya.
          </>
        )}
      </p>

      <div className="field">
        <label className="field-label" htmlFor={`${id}-kota`}>
          Kota
        </label>
        <input
          id={`${id}-kota`}
          aria-describedby={`${id}-kota-hint`}
          value={kota}
          onChange={(event) => {
            kotaTyped.current = true
            setKota(event.target.value)
          }}
          list={`${id}-kota-list`}
          maxLength={40}
          placeholder={findingCity ? 'Mencari nama kota…' : 'Misal: Jakarta'}
          autoComplete="off"
        />
        <datalist id={`${id}-kota-list`}>
          {kotaSuggestions.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <p id={`${id}-kota-hint`} className="hint">
          Terisi otomatis dari lokasi dan bisa diubah. Kenangan masuk ke folder kota ini.
        </p>
      </div>

      <label className="field" htmlFor={`${id}-nama`}>
        <span className="field-label">Judul</span>
        <input
          id={`${id}-nama`}
          value={judul}
          onChange={(event) => setJudul(event.target.value)}
          maxLength={60}
          placeholder="Misal: Malam di Pantai Anyer"
          autoComplete="off"
        />
      </label>

      <label className="field" htmlFor={`${id}-tanggal`}>
        <span className="field-label">Tanggal</span>
        <input
          id={`${id}-tanggal`}
          type="date"
          value={tanggal}
          max={toInputDate(new Date())}
          onChange={(event) => setTanggal(event.target.value)}
        />
      </label>

      <label className="field" htmlFor={`${id}-cerita`}>
        <span className="field-label">
          Cerita <span className="field-optional">(opsional)</span>
        </span>
        <textarea
          id={`${id}-cerita`}
          value={cerita}
          onChange={(event) => setCerita(event.target.value)}
          rows={3}
          maxLength={400}
          placeholder="Siapa yang ikut, kejadian lucu, apa saja."
        />
      </label>

      {!storageReady && (
        <p className="form-error">Browser ini tidak mengizinkan penyimpanan, jadi kenangan baru belum bisa disimpan.</p>
      )}
      {saveFailed && (
        <p className="form-error" role="alert">
          Kenangan belum tersimpan. Penyimpanan browser mungkin penuh atau dimatikan, misalnya di mode privat.
        </p>
      )}
      {missing.length > 0 && <p className="hint">Masih perlu: {missing.join(', ')}.</p>}

      <div className="actions">
        <button type="submit" className="button button-primary" disabled={!canSave}>
          {saving ? 'Menyimpan…' : 'Simpan kenangan'}
        </button>
        <button type="button" className="button button-quiet" onClick={onCancel}>
          Batal
        </button>
      </div>

      <p className="form-note">
        Untuk sementara kenangan disimpan di browser ini saja. Setelah tersambung ke Firebase, semua anggota bisa
        melihatnya.
      </p>
    </form>
  )
}
