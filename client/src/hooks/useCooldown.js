import { useEffect, useState } from 'react'

// A seconds countdown: `start(60)` begins it, `secondsLeft` ticks down to 0.
// Used to pause a form after a rate limit ("Try again in 45s").
export function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0)

  useEffect(() => {
    if (secondsLeft <= 0) return
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [secondsLeft])

  return [secondsLeft, setSecondsLeft]
}
