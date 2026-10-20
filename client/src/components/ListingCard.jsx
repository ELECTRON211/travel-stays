import { Building2, MapPin, Users } from 'lucide-react'
import { formatNaira } from '../lib/format'

// Listings have no photos yet, so each card gets a consistent colour cover
// picked from its id. Swap this for the real photo once uploads exist.
const covers = [
  'from-emerald-400 to-teal-600',
  'from-sky-400 to-indigo-600',
  'from-amber-300 to-orange-500',
  'from-rose-400 to-pink-600',
  'from-violet-400 to-purple-600',
  'from-lime-400 to-green-600',
]

function coverFor(id = '') {
  let hash = 0
  for (const char of id) hash = (hash + char.charCodeAt(0)) % covers.length
  return covers[hash]
}

export default function ListingCard({ listing }) {
  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`relative grid aspect-[4/3] place-items-center bg-gradient-to-br ${coverFor(listing.id)}`}>
        <Building2 className="h-14 w-14 text-white/80 transition group-hover:scale-110" />
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium text-gray-800 backdrop-blur">
          <MapPin className="h-3.5 w-3.5 text-emerald-600" />
          {listing.city || 'Unknown city'}
        </span>
      </div>

      <div className="p-4">
        <h3 className="truncate font-semibold text-gray-900">{listing.title}</h3>
        <p className="mt-1 line-clamp-2 min-h-10 text-sm text-gray-500">
          {listing.description || 'No description yet.'}
        </p>

        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            Up to {listing.max_guests ?? '—'} guests
          </span>
          <p className="text-sm text-gray-600">
            <span className="text-base font-bold text-gray-900">{formatNaira(listing.price_per_night)}</span> / night
          </p>
        </div>
      </div>
    </article>
  )
}

export function ListingCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-gray-200 bg-white">
      <div className="aspect-[4/3] bg-gray-200" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 rounded bg-gray-200" />
        <div className="h-3 w-full rounded bg-gray-100" />
        <div className="h-3 w-1/2 rounded bg-gray-100" />
      </div>
    </div>
  )
}

export function ListingGrid({ listings, loading, error, skeletons = 8 }) {
  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
        Could not load stays: {error}
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {loading
        ? Array.from({ length: skeletons }, (_, i) => <ListingCardSkeleton key={i} />)
        : listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
    </div>
  )
}
