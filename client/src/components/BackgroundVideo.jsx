import { useEffect, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'

// Should a decorative background video play here? Not for people who ask
// their device to reduce motion or save data, and not on small screens
// (phones keep the lighter photo).
function shouldPlay(reduceMotion, minWidth) {
  if (reduceMotion || typeof window === 'undefined') return false
  if (navigator.connection?.saveData) return false
  return window.matchMedia(`(min-width: ${minWidth}px)`).matches
}

// Silent looping video that fades in over its poster once it can play.
// `src` can be one video or a list: a list crossfades to the next clip every
// `interval` ms, and only the previous, current and next clips are mounted.
// The parent controls `paused` (so it can show its own pause button) and
// hears about readiness through `onReady`.
export default function BackgroundVideo({
  src,
  poster,
  paused = false,
  onReady,
  minWidth = 768,
  interval = 8000,
  className = '',
}) {
  const sources = Array.isArray(src) ? src : [src]
  const count = sources.length
  const reduceMotion = useReducedMotion()
  const [enabled] = useState(() => shouldPlay(reduceMotion, minWidth))
  const [index, setIndex] = useState(0)
  const [ready, setReady] = useState(() => new Set())
  const refs = useRef({})
  const announced = useRef(false)

  const current = sources[index]
  const currentReady = ready.has(current)

  // Play or pause the clip on screen. The preloaded next clip stays still
  // until its turn, so it starts from the beginning.
  useEffect(() => {
    const el = refs.current[current]
    if (!el || !currentReady) return
    if (paused) el.pause()
    else el.play().catch(() => {})
  }, [current, paused, currentReady])

  // Move on to the next clip.
  useEffect(() => {
    if (count < 2 || paused || !currentReady) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), interval)
    return () => clearTimeout(timer)
  }, [index, count, paused, currentReady, interval])

  if (!enabled) return null

  const mounted = [...new Set([(index - 1 + count) % count, index, (index + 1) % count])]

  return (
    <>
      {mounted.map((i) => {
        const url = sources[i]
        const active = i === index
        return (
          <video
            key={url}
            ref={(el) => {
              refs.current[url] = el
            }}
            src={url}
            poster={active ? poster : undefined}
            autoPlay={active && !paused}
            muted
            loop
            playsInline
            preload="auto"
            aria-hidden="true"
            onCanPlay={() => {
              setReady((prev) => (prev.has(url) ? prev : new Set(prev).add(url)))
              if (!announced.current) {
                announced.current = true
                onReady?.()
              }
            }}
            className={`transition-opacity duration-1500 ${active && ready.has(url) ? 'opacity-100' : 'opacity-0'} ${className}`}
          />
        )
      })}
    </>
  )
}
