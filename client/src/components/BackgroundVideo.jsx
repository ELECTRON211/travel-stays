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
// The parent controls `paused` (so it can show its own pause button) and
// hears about readiness through `onReady`.
export default function BackgroundVideo({ src, poster, paused = false, onReady, minWidth = 768, className = '' }) {
  const reduceMotion = useReducedMotion()
  const [enabled] = useState(() => shouldPlay(reduceMotion, minWidth))
  const [ready, setReady] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || !ready) return
    if (paused) el.pause()
    else el.play().catch(() => {})
  }, [paused, ready])

  if (!enabled) return null

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      aria-hidden="true"
      onCanPlay={() => {
        setReady(true)
        onReady?.()
      }}
      className={`transition-opacity duration-[1500ms] ${ready ? 'opacity-100' : 'opacity-0'} ${className}`}
    />
  )
}
