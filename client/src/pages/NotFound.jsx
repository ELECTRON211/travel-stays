import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Compass } from 'lucide-react'
import TypeWriter from '../components/TypeWriter'

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <motion.span
        animate={{ rotate: 360 }}
        transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
        className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <Compass className="h-10 w-10" strokeWidth={1.5} />
      </motion.span>
      <p className="mt-8 font-display text-8xl font-medium text-ink">404</p>
      <h1 className="mt-2 font-display text-3xl text-ink">
        You've wandered <em className="text-emerald-700"><TypeWriter text="off the map." /></em>
      </h1>
      <p className="mt-3 text-stone-500">The page you are looking for doesn't exist or has moved.</p>
      <Link
        to="/"
        className="mt-10 rounded-full bg-emerald-800 px-7 py-3 font-semibold text-white transition hover:bg-emerald-900"
      >
        Back to home
      </Link>
    </div>
  )
}
