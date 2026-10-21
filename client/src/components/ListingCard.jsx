import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Building2, MapPin, ShieldCheck, Star, Zap } from 'lucide-react'
import { formatNaira } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { fadeUp, stagger } from '../lib/motion'

// Listings without photos get a soft, neutral placeholder; the tint varies
// slightly by id so a grid of them doesn't look identical.
const covers = [
  'from-stone-200 via-stone-100 to-stone-300',
  'from-stone-300 via-stone-100 to-stone-200',
  'from-emerald-100/60 via-stone-100 to-stone-200',
  'from-amber-100/60 via-stone-100 to-stone-200',
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
    <div className={`relative h-full w-full overflow-hidden bg-linear-to-br ${coverFor(listing.id)} ${className}`}>
      <div className="absolute -left-1/4 top-1/4 h-3/4 w-3/4 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute -bottom-1/4 -right-1/4 h-2/3 w-2/3 rounded-full bg-emerald-900/10 blur-3xl" />
      <Building2 className="absolute right-4 top-4 h-7 w-7 text-stone-400/70" strokeWidth={1.25} />
    </div>
  )
}

// Trust badges shown on top of the photo.
export function TrustBadges({ listing, className = '' }) {
  const badges = []
  if (listing.host_verified) badges.push({ icon: ShieldCheck, label: 'Verified host', tone: 'text-emerald-800' })
  if (listing.booking_mode === 'instant') badges.push({ icon: Zap, label: 'Instant Book', tone: 'text-amber-600' })
  if (!badges.length) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {badges.map(({ icon: Icon, label, tone }) => (
        <span
          key={label}
          className="flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-stone-900 shadow-sm backdrop-blur-md"
        >
          <Icon className={`h-3.5 w-3.5 ${tone}`} fill={label === 'Instant Book' ? 'currentColor' : 'none'} />
          {label}
        </span>
      ))}
    </div>
  )
}

// "★ 4.8 (12)" once a listing has reviews, otherwise a "New" tag.
export function Rating({ listing, className = '' }) {
  if (!listing.review_count || listing.rating == null) {
    return (
      <span className={`rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800 ${className}`}>
        New
      </span>
    )
  }
  return (
    <span className={`flex items-center gap-1 text-sm text-stone-900 ${className}`}>
      <Star className="h-3.5 w-3.5 fill-current" />
      <span className="font-semibold">{Number(listing.rating).toFixed(1)}</span>
      <span className="text-stone-500">({listing.review_count})</span>
    </span>
  )
}

// `search` ("?checkin=...&guests=...") carries the visitor's search into the
// listing page so the booking box starts with the same dates.
export default function ListingCard({ listing, search = '' }) {
  return (
    <Link
      to={`/listings/${listing.id}${search}`}
      className="group block transition-transform duration-300 ease-out hover:scale-[1.02]"
    >
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-900/5 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-stone-900/15">
        <ListingCover listing={listing} className="transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />

        <TrustBadges listing={listing} className="absolute left-3 top-3 right-3" />
        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-sm font-medium text-white drop-shadow">
          <MapPin className="h-4 w-4" />
          {listing.city || 'Unknown city'}
        </span>
      </div>

      <div className="mt-3 px-0.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate font-semibold tracking-tight text-stone-900">{listing.title}</h3>
          <Rating listing={listing} className="shrink-0" />
        </div>
        <p className="mt-0.5 text-sm text-stone-500">
          {propertyLabel(listing.property_type)} · {listing.max_guests ?? '—'} guests · {listing.bedrooms ?? '—'}{' '}
          {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
        </p>
        <p className="mt-1.5 text-[15px]">
          <span className="font-semibold text-stone-900">{formatNaira(listing.price_per_night)}</span>{' '}
          <span className="text-stone-500">night</span>
        </p>
      </div>
    </Link>
  )
}

// Mirrors the card layout so the page doesn't jump when results arrive.
export function ListingCardSkeleton() {
  return (
    <div>
      <div className="shimmer relative aspect-4/3 rounded-xl">
        <div className="absolute left-3 top-3 h-6 w-24 rounded-full bg-white/60" />
      </div>
      <div className="mt-3 space-y-2 px-0.5">
        <div className="flex justify-between gap-3">
          <div className="shimmer h-4 w-2/3 rounded-full" />
          <div className="shimmer h-4 w-10 rounded-full" />
        </div>
        <div className="shimmer h-3 w-1/2 rounded-full" />
        <div className="shimmer h-3.5 w-1/4 rounded-full" />
      </div>
    </div>
  )
}

const gridClass = 'grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export function ListingGrid({ listings, loading, error, skeletons = 8, search = '' }) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
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
      variants={stagger(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '0px 0px -60px 0px' }}
      className={gridClass}
    >
      {listings.map((listing) => (
        <motion.div key={listing.id} variants={fadeUp}>
          <ListingCard listing={listing} search={search} />
        </motion.div>
      ))}
    </motion.div>
  )
}
