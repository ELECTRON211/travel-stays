import { useEffect, useRef, useState } from 'react'
import { useInView, useReducedMotion } from 'motion/react'

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
    <span ref={ref} className={`inline-grid ${className}`}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true" className="invisible col-start-1 row-start-1">
        {text}
      </span>
      <span aria-hidden="true" className="col-start-1 row-start-1">
        {reduceMotion ? text : text.slice(0, count)}
        {!done && <span className="typing-caret" />}
      </span>
    </span>
  )
}

// Types a word, pauses, deletes it and moves on to the next — forever.
export function RotatingTyper({ words, typeSpeed = 70, deleteSpeed = 35, pause = 1800, className = '' }) {
  const reduceMotion = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const word = words[index]

  useEffect(() => {
    if (reduceMotion) return
    let timer
    if (!deleting && length < word.length) {
      timer = setTimeout(() => setLength(length + 1), typeSpeed)
    } else if (!deleting) {
      timer = setTimeout(() => setDeleting(true), pause)
    } else if (length > 0) {
      timer = setTimeout(() => setLength(length - 1), deleteSpeed)
    } else {
      timer = setTimeout(() => {
        setDeleting(false)
        setIndex((index + 1) % words.length)
      }, 250)
    }
    return () => clearTimeout(timer)
  }, [reduceMotion, word, length, deleting, index, words.length, typeSpeed, deleteSpeed, pause])

  return (
    <span className={className}>
      <span className="sr-only">{words[0]}</span>
      <span aria-hidden="true">
        {reduceMotion ? words[0] : word.slice(0, length)}
        {!reduceMotion && <span className="typing-caret" />}
      </span>
    </span>
  )
}
