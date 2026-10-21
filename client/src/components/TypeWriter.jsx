import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'
import { useTypingCycle } from '../hooks/useTypingCycle'

// Types `text` out letter by letter, with a blinking cursor, the first time
// it scrolls into view. The full text is laid out invisibly underneath so the
// page never jumps while typing, and screen readers get the whole text at
// once. People who ask their device to reduce motion just see the text.
export default function TypeWriter({ text, speed = 55, delay = 200, className = '' }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const reduceMotion = useReducedMotion()
  const [progress, setProgress] = useState({ text, count: 0 })
  const count = progress.text === text ? progress.count : 0 // restart if the text changes
  const done = reduceMotion || count >= text.length

  useEffect(() => {
    if (!inView || done) return
    const timer = setTimeout(() => setProgress({ text, count: count + 1 }), count === 0 ? delay : speed)
    return () => clearTimeout(timer)
  }, [inView, done, text, count, speed, delay])

  return (
    // Bottom layer: the real text, transparent — it reserves the space and is
    // what screen readers read and what gets copied (once). Top layer: the
    // typed letters, purely visual.
    <span ref={ref} className={`inline-grid ${className}`}>
      <span className="col-start-1 row-start-1 text-transparent">{text}</span>
      <span aria-hidden="true" className="pointer-events-none col-start-1 row-start-1 select-none">
        {reduceMotion ? text : text.slice(0, count)}
        {!done && <span className="typing-caret" />}
      </span>
    </span>
  )
}

// Types a word, pauses, deletes it and moves on to the next — forever.
export function RotatingTyper({ words, typeSpeed, deleteSpeed, pause, className = '' }) {
  const reduceMotion = useReducedMotion()
  const text = useTypingCycle(words, { enabled: !reduceMotion, typeSpeed, deleteSpeed, pause })

  return (
    <span className={className}>
      <span className="sr-only">{words[0]}</span>
      <span aria-hidden="true">
        {reduceMotion ? words[0] : text}
        {!reduceMotion && <span className="typing-caret" />}
      </span>
    </span>
  )
}
