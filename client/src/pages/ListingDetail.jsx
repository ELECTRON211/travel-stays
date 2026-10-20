import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, BedDouble, CalendarCheck, Grid2x2, Home, MapPin, ShieldCheck, Users, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { fetchListing } from '../lib/listings'
import { formatNaira } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { ease, fadeUp, stagger } from '../lib/motion'
import { ListingCover, Rating, TrustBadges } from '../components/ListingCard'
import Lightbox from '../components/Lightbox'
import Reveal from '../components/Reveal'
import NotFound from './NotFound'

// Big cover photo on the left, up to four smaller photos on the right.
// Clicking any photo opens the full-screen viewer.
function Gallery({ listing, onOpen }) {
  const photos = listing.photos ?? []

  if (photos.length <= 1) {
    return (
      <motion.button
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease }}
        onClick={() => photos.length && onOpen(0)}
        className="block aspect-video w-full overflow-hidden rounded-4xl md:aspect-21/9"
      >
        <ListingCover listing={listing} />
      </motion.button>
    )
  }

  const tiles = photos.slice(0, 5)
  return (
    <div className="relative">
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="grid h-80 gap-2 overflow-hidden rounded-4xl md:h-120 md:grid-cols-4 md:grid-rows-2"
      >
        {tiles.map((photo, i) => (
          <motion.button
            key={photo}
            variants={fadeUp}
            onClick={() => onOpen(i)}
            className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : 'hidden md:block'}`}
          >
            <ListingCover
              listing={listing}
              photo={photo}
              className="transition-transform duration-700 ease-out group-hover:scale-105"
            />
            <span className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/15" />
          </motion.button>
        ))}
      </motion.div>
      <button
        onClick={() => onOpen(0)}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg transition hover:scale-105"
      >
        <Grid2x2 className="h-4 w-4" /> Show all {photos.length} photos
      </button>
    </div>
  )
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <Icon className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{value}</p>
    </div>
  )
}

export default function ListingDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: listing, loading, error } = useAsync(() => fetchListing(id), id)
  const [photoIndex, setPhotoIndex] = useState(null)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="shimmer h-5 w-32 rounded-full" />
        <div className="shimmer mt-6 h-80 rounded-4xl md:h-120" />
        <div className="shimmer mt-10 h-10 w-1/2 rounded-full" />
        <div className="shimmer mt-4 h-5 w-1/4 rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          Could not load this listing: {error}
        </div>
      </div>
    )
  }

  if (!listing) return <NotFound />

  const isOwner = user?.id === listing.host_id
  const bedrooms = `${listing.bedrooms} ${listing.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/stays"
        className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to stays
      </Link>

      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex flex-col justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200 sm:flex-row sm:items-center"
        >
          <span>
            This is your listing{listing.status === 'paused' ? ' — it is paused and hidden from search.' : '.'}
          </span>
          <Link to="/host/listings" className="font-semibold underline underline-offset-4">
            Manage my listings
          </Link>
        </motion.div>
      )}

      <div className="mt-6">
        <Gallery listing={listing} onOpen={setPhotoIndex} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div variants={stagger(0.08, 0.2)} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              {propertyLabel(listing.property_type)}
            </motion.p>
            <motion.h1
              variants={fadeUp}
              className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl"
            >
              {listing.title}
            </motion.h1>
            <motion.div variants={fadeUp} className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-stone-500">
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> {listing.city}, Nigeria
              </span>
              <Rating listing={listing} />
              <TrustBadges listing={listing} className="[&>span]:bg-stone-100 [&>span]:shadow-none" />
            </motion.div>
          </motion.div>

          <Reveal delay={0.1} className="mt-10 grid grid-cols-3 gap-3">
            <Fact icon={Users} label="Guests" value={`Up to ${listing.max_guests}`} />
            <Fact icon={BedDouble} label="Bedrooms" value={bedrooms} />
            <Fact icon={Home} label="Type" value={propertyLabel(listing.property_type)} />
          </Reveal>

          <Reveal className="mt-12 border-t border-black/5 pt-10">
            <h2 className="font-display text-2xl text-ink">About this place</h2>
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-stone-600">
              {listing.description || 'The host has not added a description yet.'}
            </p>
          </Reveal>
        </div>

        <aside>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="sticky top-24 rounded-4xl bg-white p-7 shadow-2xl shadow-emerald-950/10 ring-1 ring-black/5"
          >
            <p className="text-stone-500">
              <span className="font-display text-4xl font-medium text-ink">{formatNaira(listing.price_per_night)}</span>{' '}
              / night
            </p>

            <button
              disabled
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-4 font-semibold text-white opacity-60"
            >
              {listing.booking_mode === 'instant' ? <Zap className="h-5 w-5" /> : <CalendarCheck className="h-5 w-5" />}
              {listing.booking_mode === 'instant' ? 'Instant Book' : 'Request to book'}
            </button>
            <p className="mt-3 text-center text-xs text-stone-500">Online booking is coming soon.</p>

            <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" />
              Your payment is held securely and only released to the host after check-in.
            </div>
          </motion.div>
        </aside>
      </div>

      <Lightbox
        photos={listing.photos ?? []}
        index={photoIndex}
        onClose={() => setPhotoIndex(null)}
        onChange={setPhotoIndex}
      />
    </div>
  )
}
