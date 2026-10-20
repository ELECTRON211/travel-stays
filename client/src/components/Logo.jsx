import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Plane } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="group flex items-center gap-2.5">
      <motion.span
        whileHover={{ rotate: -12, scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15 }}
        className="grid h-9 w-9 place-items-center rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/30"
      >
        <Plane className="h-5 w-5 -rotate-45" />
      </motion.span>
      <span className={`text-lg font-bold tracking-tight transition-colors ${light ? 'text-white' : 'text-ink'}`}>
        Travel<span className="font-display font-medium italic text-emerald-500">&amp;</span>Stays
      </span>
    </Link>
  )
}
