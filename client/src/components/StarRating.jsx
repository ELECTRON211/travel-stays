import { useState } from 'react'
import { motion } from 'motion/react'
import { Star } from 'lucide-react'

// Shows 1–5 stars. Pass `onChange` to let people pick a rating (with a hover
// preview); leave it out to just display `value`.
export default function StarRating({ value = 0, onChange, size = 'h-5 w-5', className = '' }) {
  const [hover, setHover] = useState(0)
  const interactive = Boolean(onChange)
  const shown = hover || value

  return (
    <div
      className={`flex items-center gap-0.5 ${className}`}
      onMouseLeave={() => setHover(0)}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Your rating' : `${value} out of 5 stars`}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const icon = (
          <Star
            className={`${size} transition-colors ${n <= shown ? 'fill-amber-400 text-amber-400' : 'text-stone-300'}`}
            strokeWidth={1.75}
          />
        )
        if (!interactive) return <span key={n}>{icon}</span>
        return (
          <motion.button
            key={n}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => onChange(n)}
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            className="rounded p-0.5"
          >
            {icon}
          </motion.button>
        )
      })}
    </div>
  )
}
