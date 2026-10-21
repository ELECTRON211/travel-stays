import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowRight,
  BedDouble,
  Compass,
  Leaf,
  MapPin,
  Mountain,
  Palette,
  SearchX,
  UtensilsCrossed,
} from 'lucide-react'
import SearchBar from '../components/SearchBar'
import DiscoveryToggle from '../components/DiscoveryToggle'
import Reveal from '../components/Reveal'
import { ListingGrid } from '../components/ListingCard'
import { useListings } from '../hooks/useListings'
import { DESTINATIONS, PROPERTY_TYPES, propertyLabel } from '../lib/constants'
import { fadeUp, stagger } from '../lib/motion'

const sorters = {
  newest: () => 0, // already ordered newest-first by the query
  'price-asc': (a, b) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0),
  'price-desc': (a, b) => (b.price_per_night ?? 0) - (a.price_per_night ?? 0),
}

const typeOptions = [{ value: '', label: 'All stays' }, ...PROPERTY_TYPES]

const tourCategories = [
  { icon: UtensilsCrossed, label: 'Food tours', text: 'Suya spots, buka favourites and market walks' },
  { icon: Mountain, label: 'Adventure', text: 'Hikes, waterfalls and canopy walks' },
  { icon: Palette, label: 'Culture', text: 'Festivals, art galleries and heritage sites' },
  { icon: Leaf, label: 'Nature', text: 'Beaches, lakes and wildlife reserves' },
]

const tripSteps = [
  { icon: BedDouble, day: 'Day 1', title: 'Check in to your stay', text: 'Your apartment in Calabar is ready.' },
  { icon: Compass, day: 'Day 2', title: 'Join a guided tour', text: 'A morning hike to Agbokim Waterfalls.' },
  { icon: UtensilsCrossed, day: 'Day 3', title: 'Food tour, then check out', text: 'Everything on one itinerary.' },
]

// Shown for the Tours and Combined Trips tabs until those features launch.
function ComingSoon({ mode, city }) {
  const tours = mode === 'tours'
  return (
    <motion.div
      key={mode}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-stone-900/5"
    >
      <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-800">
            Coming soon
          </span>
          <h2 className="mt-5 font-display text-4xl font-medium leading-tight tracking-tight text-stone-900">
            {tours ? (
              <>
                Tours &amp; experiences are <em className="text-emerald-800">almost here.</em>
              </>
            ) : (
              <>
                One trip, <em className="text-emerald-800">one itinerary.</em>
              </>
            )}
          </h2>
          <p className="mt-4 leading-relaxed text-stone-600">
            {tours
              ? 'Local guides are joining Travel & Stays now. Soon you will be able to book food tours, hikes and cultural days right next to your stay.'
              : 'Combined trips bring your stay and your tours together, so every booking for your trip lives in one shareable plan.'}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={city ? `/stays?city=${encodeURIComponent(city)}` : '/stays'}
              className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
            >
              Browse stays{city ? ` in ${city}` : ''} <ArrowRight className="h-4 w-4" />
            </Link>
            {tours && (
              <Link
                to="/signup?role=guide"
                className="inline-flex items-center rounded-full px-6 py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-900"
              >
                Become a guide
              </Link>
            )}
          </div>
        </div>

        <motion.div
          variants={stagger(0.08, 0.15)}
          initial="hidden"
          animate="show"
          className={`lg:col-span-3 ${tours ? 'grid gap-3 sm:grid-cols-2' : 'relative space-y-3'}`}
        >
          {tours
            ? tourCategories.map(({ icon: Icon, label, text }) => (
                <motion.div key={label} variants={fadeUp} className="rounded-xl bg-stone-50 p-6 ring-1 ring-stone-900/5">
                  <Icon className="h-7 w-7 text-emerald-800" strokeWidth={1.5} />
                  <p className="mt-4 font-semibold text-stone-900">{label}</p>
                  <p className="mt-1 text-sm text-stone-500">{text}</p>
                </motion.div>
              ))
            : tripSteps.map(({ icon: Icon, day, title, text }) => (
                <motion.div
                  key={day}
                  variants={fadeUp}
                  className="flex items-center gap-5 rounded-xl bg-stone-50 p-5 ring-1 ring-stone-900/5"
                >
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-emerald-800 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">{day}</p>
                    <p className="font-semibold text-stone-900">{title}</p>
                    <p className="text-sm text-stone-500">{text}</p>
                  </div>
                </motion.div>
              ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

// Zero results: explain why, offer one-click fixes and other places to try.
function EmptyState({ city, guests, type, onRemove }) {
  const otherCities = DESTINATIONS.filter((d) => d.city.toLowerCase() !== city.toLowerCase()).slice(0, 4)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white px-6 py-16 text-center ring-1 ring-stone-900/5 sm:px-12"
    >
      <motion.span
        animate={{ rotate: [0, -8, 8, 0] }}
        transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
        className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-emerald-50"
      >
        <SearchX className="h-9 w-9 text-emerald-800" />
      </motion.span>
      <h2 className="mt-6 font-display text-3xl tracking-tight text-stone-900">
        {city ? `Nothing in ${city} just yet` : 'No stays match those filters'}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-stone-500">
        {city
          ? `We're still welcoming hosts in ${city}. Try loosening a filter, or explore somewhere nearby.`
          : 'Try loosening a filter or two — the right place might be one click away.'}
      </p>

      {(guests || type || city) && (
        <div className="mt-8 flex flex-wrap justify-center gap-2">
          {type && (
            <button
              onClick={() => onRemove('type')}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900"
            >
              Show all types, not just {propertyLabel(type).toLowerCase()}s
            </button>
          )}
          {guests && (
            <button
              onClick={() => onRemove('guests')}
              className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900"
            >
              Remove the {guests}-guest filter
            </button>
          )}
          <Link
            to="/stays"
            className="rounded-full bg-emerald-800 px-5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            Clear all filters
          </Link>
        </div>
      )}

      <div className="mx-auto mt-12 max-w-2xl border-t border-stone-100 pt-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">Or try another destination</p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {otherCities.map(({ city: name, note }) => (
            <Link
              key={name}
              to={`/stays?city=${encodeURIComponent(name)}`}
              className="group rounded-xl bg-stone-50 p-4 text-left ring-1 ring-stone-900/5 transition hover:bg-emerald-50 hover:ring-emerald-800/20"
            >
              <MapPin className="h-4 w-4 text-emerald-800" />
              <p className="mt-2 text-sm font-semibold text-stone-900">{name}</p>
              <p className="text-xs text-stone-500">{note}</p>
            </Link>
          ))}
        </div>
      </div>
    </motion.div>
  )
}

export default function Stays() {
  const [searchParams, setSearchParams] = useSearchParams()
  const city = searchParams.get('city') ?? ''
  const guests = searchParams.get('guests') ?? ''
  const type = searchParams.get('type') ?? ''
  const mode = searchParams.get('mode') ?? 'stays'
  const [sort, setSort] = useState('newest')

  const { listings, loading, error } = useListings({ city, guests, type })
  const sorted = [...listings].sort(sorters[sort])

  // Pass the chosen dates and guests on to each listing's booking box.
  const carried = new URLSearchParams()
  for (const key of ['checkin', 'checkout', 'guests']) {
    if (searchParams.get(key)) carried.set(key, searchParams.get(key))
  }
  const bookingSearch = carried.size ? `?${carried}` : ''

  function setParam(key, value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      {/* Hero card: heading, discovery tabs and search grouped together */}
      <Reveal className="relative z-20 rounded-3xl bg-white/70 px-4 py-8 text-center shadow-xl shadow-stone-900/5 ring-1 ring-stone-900/5 backdrop-blur-md sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          <div className="absolute -top-24 left-1/2 h-48 w-160 -translate-x-1/2 rounded-full bg-emerald-100/60 blur-3xl" />
        </div>
        <div className="relative">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
            {city ? 'Destination' : 'Explore'}
          </p>
          <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl">
            {city ? (
              <>
                {mode === 'stays' ? 'Stays' : mode === 'tours' ? 'Tours' : 'Trips'} in{' '}
                <em className="text-emerald-800">{city}</em>
              </>
            ) : (
              <>
                Find your next <em className="text-emerald-800">{mode === 'stays' ? 'stay.' : 'adventure.'}</em>
              </>
            )}
          </h1>

          <div className="mt-6">
            <DiscoveryToggle value={mode} onChange={(value) => setParam('mode', value === 'stays' ? '' : value)} />
          </div>

          <div className="mx-auto mt-5 max-w-5xl text-left">
            {/* key= resets the form fields when the URL search changes */}
            <SearchBar key={searchParams.toString()} initial={Object.fromEntries(searchParams)} mode={mode} />
          </div>
        </div>
      </Reveal>

      {mode !== 'stays' ? (
        <div className="mt-10">
          <ComingSoon mode={mode} city={city} />
        </div>
      ) : (
        <>
          <Reveal delay={0.2} className="mt-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              {typeOptions.map((option) => {
                const active = type === option.value
                return (
                  <button
                    key={option.value}
                    onClick={() => setParam('type', option.value)}
                    className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                      active ? 'text-white' : 'bg-white text-stone-600 ring-1 ring-stone-900/5 hover:text-stone-900'
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="type-pill"
                        className="absolute inset-0 rounded-full bg-emerald-800"
                        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                      />
                    )}
                    <span className="relative">{option.label}</span>
                  </button>
                )
              })}
            </div>

            <div className="flex items-center justify-between gap-4 lg:justify-end">
              {loading ? (
                <span className="shimmer h-4 w-24 rounded-full" aria-label="Loading results" />
              ) : (
                <p className="text-sm text-stone-500">
                  <span className="font-semibold text-stone-900">{listings.length}</span>{' '}
                  {listings.length === 1 ? 'place' : 'places'}
                  {guests ? ` for ${guests}+ guests` : ''}
                </p>
              )}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-stone-900 ring-1 ring-stone-900/10 outline-none"
                aria-label="Sort stays"
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
              </select>
            </div>
          </Reveal>

          <div className="mt-10">
            <ListingGrid listings={sorted} loading={loading} error={error} search={bookingSearch} />
          </div>

          {!loading && !error && listings.length === 0 && (
            <EmptyState city={city} guests={guests} type={type} onRemove={(key) => setParam(key, '')} />
          )}
        </>
      )}
    </div>
  )
}
