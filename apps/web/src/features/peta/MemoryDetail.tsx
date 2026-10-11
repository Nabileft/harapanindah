import { useState } from 'react'
import { placeAndDate } from './format'
import { CloseIcon } from './icons'
import type { Memory } from './types'

type Props = {
  memory: Memory
  onClose: () => void
  onOpenPhoto: (index: number) => void
  onDelete: () => Promise<void>
}

export function MemoryDetail({ memory, onClose, onOpenPhoto, onDelete }: Props) {
  const [index, setIndex] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteFailed, setDeleteFailed] = useState(false)
  const photo = memory.foto[index] ?? memory.foto[0]

  const confirmDelete = async () => {
    setDeleting(true)
    setDeleteFailed(false)
    try {
      await onDelete()
    } catch {
      setDeleteFailed(true)
      setDeleting(false)
    }
  }

  return (
    <article className="panel panel-detail" aria-labelledby="kenangan-judul">
      <button type="button" className="icon-button panel-close" onClick={onClose} aria-label="Tutup">
        <CloseIcon />
      </button>

      {photo && (
        <button type="button" className="detail-photo" onClick={() => onOpenPhoto(index)}>
          <img src={photo.src} width={photo.width} height={photo.height} alt={`Foto ${memory.judul}`} />
          <span className="detail-photo-hint">Lihat layar penuh</span>
        </button>
      )}

      {memory.foto.length > 1 && (
        <ul className="detail-thumbs" aria-label="Foto lain">
          {memory.foto.map((f, i) => (
            <li key={f.thumb}>
              <button type="button" aria-pressed={i === index} aria-label={`Foto ${i + 1}`} onClick={() => setIndex(i)}>
                <img src={f.thumb} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="panel-body">
        {memory.asal === 'contoh' && <span className="chip">Contoh</span>}
        <h3 id="kenangan-judul" className="panel-title">
          {memory.judul}
        </h3>
        <p className="detail-date">{placeAndDate(memory)}</p>
        {memory.cerita && <p className="detail-story">{memory.cerita}</p>}
        <a
          className="text-link"
          href={`https://www.google.com/maps/search/?api=1&query=${memory.lat},${memory.lng}`}
          target="_blank"
          rel="noreferrer"
        >
          Buka lokasi di Google Maps
        </a>

        {memory.asal === 'lokal' &&
          (confirming ? (
            <div className="confirm">
              <p>Hapus kenangan ini? Fotonya ikut terhapus dari browser ini.</p>
              {deleteFailed && <p className="form-error">Kenangan belum terhapus. Coba lagi.</p>}
              <div className="actions">
                <button type="button" className="button button-danger" onClick={confirmDelete} disabled={deleting}>
                  {deleting ? 'Menghapus…' : 'Hapus'}
                </button>
                <button type="button" className="button button-quiet" onClick={() => setConfirming(false)}>
                  Batal
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className="button button-quiet button-small" onClick={() => setConfirming(true)}>
              Hapus kenangan
            </button>
          ))}
      </div>
    </article>
  )
}
