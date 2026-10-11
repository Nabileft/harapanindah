import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { circle } from '../data/circle'
import { heroPhoto, type PhotoPerson } from '../data/heroPhoto'
import './HeroHeader.css'

/** Seberapa besar orang membesar saat di-hover. */
const POP_SCALE = 1.07

const { width: PHOTO_W, height: PHOTO_H, people } = heroPhoto
const IMAGE_COUNT = people.length + 1

const pct = (value: number, total: number) => `${(value / total) * 100}%`

/** Posisi potongan orang di atas foto, dalam persen supaya ikut membesar/mengecil. */
const personBox = ({ box }: PhotoPerson): CSSProperties => ({
  left: pct(box.x, PHOTO_W),
  top: pct(box.y, PHOTO_H),
  width: pct(box.width, PHOTO_W),
  height: pct(box.height, PHOTO_H),
})

/** Titik atas kepala setelah orangnya membesar (membesar dari tengah bawah). */
function labelAnchor(person: PhotoPerson) {
  const originX = person.box.x + person.box.width / 2
  const originY = person.box.y + person.box.height
  return {
    x: (originX + (person.head.x - originX) * POP_SCALE) / PHOTO_W,
    y: (originY + (person.head.y - originY) * POP_SCALE) / PHOTO_H,
  }
}

/**
 * Tampilan header:
 * - 'fullscreen': foto memenuhi layar. Di laptop bagian bawah foto (kaki) terpotong.
 * - 'framed': foto tampil utuh di tengah, tepi kiri-kanannya memudar.
 */
export type HeroLayout = 'fullscreen' | 'framed'

export function HeroHeader({ layout = 'fullscreen' }: { layout?: HeroLayout }) {
  const [active, setActive] = useState<number | null>(null)
  const [imagesLoaded, setImagesLoaded] = useState(0)
  const [titleEm, setTitleEm] = useState<number | null>(null)
  const [forceShow, setForceShow] = useState(false)
  const titleRef = useRef<HTMLSpanElement>(null)
  const pointerType = useRef('mouse')

  const ready = forceShow || (imagesLoaded >= IMAGE_COUNT && titleEm !== null)
  const countImage = () => setImagesLoaded((n) => n + 1)

  // Lebar judul diukur (dalam em) setelah fontnya termuat,
  // lalu CSS mengatur ukurannya supaya selebar rombongan di foto.
  useEffect(() => {
    const el = titleRef.current
    if (!el) return
    let cancelled = false
    const style = getComputedStyle(el)
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`
    const measure = () => {
      if (cancelled) return
      setTitleEm(el.getBoundingClientRect().width / parseFloat(getComputedStyle(el).fontSize))
    }
    document.fonts.load(font, circle.name).then(measure, measure)
    return () => {
      cancelled = true
    }
  }, [])

  // Cadangan: kalau ada gambar/font yang lambat, header tetap muncul.
  useEffect(() => {
    const timer = setTimeout(() => setForceShow(true), 4000)
    return () => clearTimeout(timer)
  }, [])

  const release = (i: number) => setActive((current) => (current === i ? null : current))
  const toggle = (i: number) => setActive((current) => (current === i ? null : i))

  return (
    <header
      className="hero"
      data-layout={layout}
      data-ready={ready}
      data-active={active !== null}
      style={{ '--pop-scale': POP_SCALE, '--title-em': titleEm ?? 6 } as CSSProperties}
      onClick={() => setActive(null)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setActive(null)
      }}
    >
      {/* Foto, judul, lalu potongan tiap orang: judul jadi ada di belakang kepala. */}
      <div className="hero-frame hero-fade">
        <img
          className="hero-photo"
          src={heroPhoto.src}
          width={PHOTO_W}
          height={PHOTO_H}
          alt={`Foto bersama ${circle.name}`}
          fetchPriority="high"
          draggable={false}
          onLoad={countImage}
          onError={countImage}
        />

        <h1 className="hero-title">
          <span ref={titleRef}>{circle.name}</span>
        </h1>

        {people.map((person) => (
          <img
            key={person.cutout}
            className="hero-person"
            src={person.cutout}
            alt=""
            draggable={false}
            onLoad={countImage}
            onError={countImage}
            style={personBox(person)}
          />
        ))}
      </div>

      <div className="hero-shade" />

      {/* Orang yang sedang di-hover: terang, membesar dari kaki, ada bayangan. */}
      <div className="hero-frame hero-fade hero-pop" aria-hidden="true">
        {people.map((person, i) => (
          <img
            key={person.cutout}
            className="hero-person"
            data-active={active === i}
            src={person.cutout}
            alt=""
            draggable={false}
            style={personBox(person)}
          />
        ))}
      </div>

      <div className="hero-bottom-fade" />

      {/* Label nama dan area hover, di atas foto. */}
      <div className="hero-frame hero-overlay">
        {people.map((person, i) => {
          const member = circle.members[i]
          const anchor = labelAnchor(person)
          return (
            <div
              key={person.cutout}
              className="hero-label"
              data-visible={active === i}
              aria-hidden="true"
              style={{ '--x': anchor.x, '--y': anchor.y } as CSSProperties}
            >
              <p className="hero-label-name">{member?.name}</p>
              {member?.keterangan && <p className="hero-label-note">{member.keterangan}</p>}
            </div>
          )
        })}

        <svg
          className="hero-hit"
          viewBox={`0 0 ${PHOTO_W} ${PHOTO_H}`}
          preserveAspectRatio="none"
          role="group"
          aria-label={`Anggota ${circle.name}`}
        >
          {people.map((person, i) => {
            const member = circle.members[i]
            return (
              <path
                key={person.cutout}
                d={person.outline}
                tabIndex={0}
                role="button"
                aria-pressed={active === i}
                aria-label={member ? `${member.name}, ${member.keterangan}` : `Anggota ${i + 1}`}
                onPointerDown={(e) => {
                  pointerType.current = e.pointerType
                }}
                onPointerEnter={(e) => {
                  if (e.pointerType === 'mouse') setActive(i)
                }}
                onPointerLeave={(e) => {
                  if (e.pointerType === 'mouse') release(i)
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  // Di HP tidak ada hover: ketuk untuk memunculkan, ketuk lagi untuk menutup.
                  if (pointerType.current !== 'mouse') toggle(i)
                }}
                onFocus={(e) => {
                  if (e.currentTarget.matches(':focus-visible')) setActive(i)
                }}
                onBlur={() => release(i)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggle(i)
                  }
                }}
              />
            )
          })}
        </svg>
      </div>

    </header>
  )
}
