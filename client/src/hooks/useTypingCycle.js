import { useEffect, useState } from 'react'

// Types a word, pauses, deletes it and moves on to the next — forever.
// Returns the text to show right now. Pass `enabled: false` to pause it.
export function useTypingCycle(words, { enabled = true, typeSpeed = 70, deleteSpeed = 35, pause = 1800 } = {}) {
  const [index, setIndex] = useState(0)
  const [length, setLength] = useState(0)
  const [deleting, setDeleting] = useState(false)
  const word = words[index % words.length]

  useEffect(() => {
    if (!enabled) return
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
        setIndex((i) => (i + 1) % words.length)
      }, 250)
    }
    return () => clearTimeout(timer)
  }, [enabled, word, length, deleting, words.length, typeSpeed, deleteSpeed, pause])

  return word.slice(0, length)
}
