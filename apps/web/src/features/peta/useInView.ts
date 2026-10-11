import { useEffect, useRef, useState } from 'react'

/** true setelah elemen mendekati layar. Dipakai supaya peta baru dimuat saat hampir terlihat. */
export function useInView<T extends Element>(rootMargin = '600px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(() => typeof IntersectionObserver === 'undefined')

  useEffect(() => {
    const element = ref.current
    if (!element || inView) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      { rootMargin },
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [inView, rootMargin])

  return [ref, inView] as const
}
