import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BedDouble, CalendarCheck, Home, MapPin, ShieldCheck, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { fetchListing } from '../lib/listings'
import { formatNaira } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { ListingCover } from '../components/ListingCard'
import NotFound from './NotFound'

// Big cover photo on the left, up to four smaller photos on the right.
function Gallery({ listing }) {
  const photos = listing.photos ?? []

  if (photos.length <= 1) {
    return (
      <div className="aspect-[16/9] overflow-hidden rounded-2xl md:aspect-[21/9]">
        <ListingCover listing={listing} />
      </div>
    )
  }

  const [cover, ...rest] = photos
  return (
    <div className="grid h-72 gap-2 overflow-hidden rounded-2xl md:h-[28rem] md:grid-cols-4 md:grid-rows-2">
      <div className="md:col-span-2 md:row-span-2">
        <ListingCover listing={listing} photo={cover} />
      </div>
      {rest.slice(0, 4).map((photo) => (
        <div key={photo} className="hidden md:block">
          <ListingCover listing={listing} photo={photo} />
        </div>
      ))}
    </div>
  )
}

function Fact({ icon: Icon, children }) {
  return (
    <span className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700">
      <Icon className="h-5 w-5 text-emerald-600" />
      {children}
    </span>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: listing, loading, error } = useAsync(() => fetchListing(id), id)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse px-4 py-8 sm:px-6 lg:px-8">
        <div className="h-6 w-32 rounded bg-gray-200" />
        <div className="mt-6 h-72 rounded-2xl bg-gray-200 md:h-[28rem]" />
        <div className="mt-8 h-8 w-1/2 rounded bg-gray-200" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load this listing: {error}
        </div>
      </div>
    )
  }

  if (!listing) return <NotFound />

  const isOwner = user?.id === listing.host_id

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link to="/stays" className="inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Back to stays
      </Link>

      {isOwner && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 sm:flex-row sm:items-center">
          <span>
            This is your listing{listing.status === 'paused' ? ' — it is paused and hidden from search.' : '.'}
          </span>
          <Link to="/host/listings" className="font-semibold underline">
            Manage my listings
          </Link>
        </div>
      )}

      <div className="mt-6">
        <Gallery listing={listing} />
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
            {propertyLabel(listing.property_type)}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">{listing.title}</h1>
          <p className="mt-2 flex items-center gap-1 text-gray-500">
            <MapPin className="h-4 w-4" /> {listing.city}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Fact icon={Users}>Up to {listing.max_guests} guests</Fact>
            <Fact icon={BedDouble}>
              {listing.bedrooms} {listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}
            </Fact>
            <Fact icon={Home}>{propertyLabel(listing.property_type)}</Fact>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold text-gray-900">About this place</h2>
            <p className="mt-3 whitespace-pre-line leading-relaxed text-gray-600">
              {listing.description || 'The host has not added a description yet.'}
            </p>
          </div>
        </div>

        <aside>
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-900/5">
            <p className="text-gray-600">
              <span className="text-2xl font-bold text-gray-900">{formatNaira(listing.price_per_night)}</span> / night
            </p>

            <button
              disabled
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 font-semibold text-white opacity-60"
            >
              <CalendarCheck className="h-5 w-5" /> Reserve
            </button>
            <p className="mt-3 text-center text-xs text-gray-500">Online booking is coming soon.</p>

            <div className="mt-6 flex items-start gap-3 border-t border-gray-100 pt-6 text-sm text-gray-600">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              Your payment will be held securely and only released to the host after check-in.
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
