import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowUpRight, Building2, MapPin } from 'lucide-react'
import { formatNaira } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { fadeUp, stagger } from '../lib/motion'

// Listings without photos get a consistent colour cover picked from their id.
const covers = [
  'from-emerald-800 to-teal-500',
  'from-slate-800 to-slate-500',
  'from-amber-700 to-orange-400',
  'from-sky-800 to-cyan-500',
  'from-rose-800 to-orange-400',
  'from-indigo-800 to-violet-500',
]

function coverFor(id = '') {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % covers.length
  return covers[hash]
}

// Shows the listing's first photo, or the colour cover if it has none.
export function ListingCover({ listing, photo = listing.photos?.[0], className = '' }) {
  if (photo) {
    return <img src={photo} alt={listing.title} loading="lazy" className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <div className={`relative grid h-full w-full place-items-center overflow-hidden bg-linear-to-br ${coverFor(listing.id)} ${className}`}>
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-black/20 blur-2xl" />
      <div className="relative flex flex-col items-center gap-2 text-white/90">
        <Building2 className="h-10 w-10" strokeWidth={1.5} />
        <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">Photos coming soon</span>
      </div>
    </div>
  )
}

export default function ListingCard({ listing }) {
  return (
    <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
      <Link to={`/listings/${listing.id}`} className="group block">
        <div className="relative aspect-4/3 overflow-hidden rounded-3xl bg-gray-200 shadow-sm ring-1 ring-black/5 transition-shadow duration-500 group-hover:shadow-2xl group-hover:shadow-emerald-950/20">
          <ListingCover listing={listing} className="transition-transform duration-1000 ease-out group-hover:scale-110" />
          <div className="absolute inset-0 bg-linear-to-t from-black/50 via-black/0 to-black/0 opacity-70 transition-opacity duration-500 group-hover:opacity-100" />

          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-900 backdrop-blur-md">
            {propertyLabel(listing.property_type)}
          </span>
          <span className="absolute bottom-3 left-4 flex items-center gap-1 text-sm font-medium text-white drop-shadow">
            <MapPin className="h-4 w-4" />
            {listing.city || 'Unknown city'}
          </span>
          <span className="absolute bottom-3 right-3 grid h-9 w-9 translate-y-3 place-items-center rounded-full bg-white text-gray-900 opacity-0 shadow-lg transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>

        <div className="mt-4 px-1">
          <h3 className="truncate font-semibold text-gray-900 transition-colors group-hover:text-emerald-800">
            {listing.title}
          </h3>
          <p className="mt-0.5 text-sm text-gray-500">
            {listing.max_guests ?? '—'} guests · {listing.bedrooms ?? '—'}{' '}
            {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
          </p>
          <p className="mt-2 text-sm">
            <span className="font-semibold text-gray-900">{formatNaira(listing.price_per_night)}</span>{' '}
            <span className="text-gray-500">/ night</span>
          </p>
        </div>
      </Link>
    </motion.div>
  )
}

export function ListingCardSkeleton() {
  return (
    <div>
      <div className="shimmer aspect-4/3 rounded-3xl" />
      <div className="mt-4 space-y-2 px-1">
        <div className="shimmer h-4 w-2/3 rounded-full" />
        <div className="shimmer h-3 w-1/3 rounded-full" />
        <div className="shimmer h-3 w-1/4 rounded-full" />
      </div>
    </div>
  )
}

const gridClass = 'grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export function ListingGrid({ listings, loading, error, skeletons = 8 }) {
  if (error) {
    return (
      <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Could not load stays: {error}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletons }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  // The key makes the cards animate in again whenever the results change.
  return (
    <motion.div
      key={listings.map((l) => l.id).join()}
      variants={stagger(0.08)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      className={gridClass}
    >
      {listings.map((listing) => (
        <motion.div key={listing.id} variants={fadeUp}>
          <ListingCard listing={listing} />
        </motion.div>
      ))}
    </motion.div>
  )
}
