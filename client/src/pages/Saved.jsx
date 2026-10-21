import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSaved } from '../context/SavedContext'
import { useAsync } from '../hooks/useAsync'
import { fetchSavedListings } from '../lib/saved'
import { fadeUp, stagger } from '../lib/motion'
import { ListingGrid } from '../components/ListingCard'
import TypeWriter from '../components/TypeWriter'

export default function Saved() {
  const { user } = useAuth()
  const { count } = useSaved()
  // Re-load whenever the number of saved listings changes (e.g. a heart is tapped).
  const { data: listings, loading, error } = useAsync(() => fetchSavedListings(user.id), `${user.id}:${count}`)

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
          Wishlist
        </motion.p>
        <motion.h1 variants={fadeUp} className="mt-2 font-display text-5xl font-medium tracking-tight text-stone-900">
          Saved <em className="text-emerald-800"><TypeWriter text="stays." /></em>
        </motion.h1>
        <motion.p variants={fadeUp} className="mt-2 text-stone-500">
          Places you've hearted, ready for when you're ready to book.
        </motion.p>
      </motion.div>

      <div className="mt-10">
        {listings?.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center"
          >
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50"
            >
              <Heart className="h-8 w-8 fill-rose-500 text-rose-500" />
            </motion.span>
            <h2 className="mt-6 font-display text-2xl text-stone-900">Nothing saved yet</h2>
            <p className="mt-2 text-stone-500">Tap the heart on any stay to keep it here for later.</p>
            <Link
              to="/stays"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Explore stays <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <ListingGrid listings={listings ?? []} loading={loading && !listings} error={error} skeletons={4} />
        )}
      </div>
    </div>
  )
}
