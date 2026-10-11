import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { CloseIcon, NextIcon, PrevIcon } from './icons'
import type { Memory } from './types'

type Props = {
  memory: Memory
  index: number
  onIndex: (index: number) => void
  onClose: () => void
}

/** Foto layar penuh. Esc untuk menutup, panah kiri/kanan untuk pindah foto. */
export function Lightbox({ memory, index, onIndex, onClose }: Props) {
  const closeButton = useRef<HTMLButtonElement>(null)
  const count = memory.foto.length
  const photo = memory.foto[index] ?? memory.foto[0]
  const go = (step: number) => onIndex((index + step + count) % count)

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null
    const previousOverflow = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    closeButton.current?.focus()
    return () => {
      document.documentElement.style.overflow = previousOverflow
      previousFocus?.focus?.()
    }
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      else if (event.key === 'ArrowRight' && count > 1) onIndex((index + 1) % count)
      else if (event.key === 'ArrowLeft' && count > 1) onIndex((index - 1 + count) % count)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, count, onIndex, onClose])

  if (!photo) return null

  return createPortal(
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={memory.judul} onClick={onClose}>
      <div className="lightbox-bar" onClick={(event) => event.stopPropagation()}>
        <p className="lightbox-title">{memory.judul}</p>
        {count > 1 && (
          <p className="lightbox-count">
            {index + 1} / {count}
          </p>
        )}
        <button ref={closeButton} type="button" className="icon-button" onClick={onClose} aria-label="Tutup">
          <CloseIcon />
        </button>
      </div>

      <img
        className="lightbox-photo"
        src={photo.src}
        width={photo.width}
        height={photo.height}
        alt={`Foto ${index + 1} dari ${memory.judul}`}
        onClick={(event) => event.stopPropagation()}
      />

      {count > 1 && (
        <>
          <button
            type="button"
            className="icon-button lightbox-nav lightbox-prev"
            aria-label="Foto sebelumnya"
            onClick={(event) => {
              event.stopPropagation()
              go(-1)
            }}
          >
            <PrevIcon />
          </button>
          <button
            type="button"
            className="icon-button lightbox-nav lightbox-next"
            aria-label="Foto berikutnya"
            onClick={(event) => {
              event.stopPropagation()
              go(1)
            }}
          >
            <NextIcon />
          </button>
        </>
      )}
    </div>,
    document.body,
  )
}
