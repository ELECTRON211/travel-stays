import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { SearchX } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import Reveal from '../components/Reveal'
import { ListingGrid } from '../components/ListingCard'
import { useListings } from '../hooks/useListings'
import { PROPERTY_TYPES } from '../lib/constants'

const sorters = {
  newest: () => 0, // already ordered newest-first by the query
  'price-asc': (a, b) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0),
  'price-desc': (a, b) => (b.price_per_night ?? 0) - (a.price_per_night ?? 0),
}

const typeOptions = [{ value: '', label: 'All stays' }, ...PROPERTY_TYPES]

export default function Stays() {
  const [searchParams, setSearchParams] = useSearchParams()
  const city = searchParams.get('city') ?? ''
  const guests = searchParams.get('guests') ?? ''
  const type = searchParams.get('type') ?? ''
  const [sort, setSort] = useState('newest')

  const { listings, loading, error } = useListings({ city, guests, type })
  const sorted = [...listings].sort(sorters[sort])

  function selectType(value) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set('type', value)
    else next.delete('type')
    setSearchParams(next)
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
          {city ? 'Destination' : 'Explore'}
        </p>
        <h1 className="mt-3 font-display text-5xl font-medium tracking-tight text-ink sm:text-6xl">
          {city ? (
            <>
              Stays in <em className="text-emerald-700">{city}</em>
            </>
          ) : (
            <>
              Find your next <em className="text-emerald-700">stay.</em>
            </>
          )}
        </h1>
      </Reveal>

      <Reveal delay={0.1} className="mt-8">
        {/* key= resets the form fields when the URL search changes */}
        <SearchBar key={searchParams.toString()} initial={Object.fromEntries(searchParams)} />
      </Reveal>

      <Reveal delay={0.2} className="mt-10 flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
          {typeOptions.map((option) => {
            const active = type === option.value
            return (
              <button
                key={option.value}
                onClick={() => selectType(option.value)}
                className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  active ? 'text-white' : 'bg-white text-gray-600 ring-1 ring-black/5 hover:text-ink'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="type-pill"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">{option.label}</span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center justify-between gap-4 lg:justify-end">
          <p className="text-sm text-gray-500">
            {loading
              ? 'Searching…'
              : `${listings.length} ${listings.length === 1 ? 'place' : 'places'}${guests ? ` for ${guests}+ guests` : ''}`}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-ink ring-1 ring-black/10 outline-none"
            aria-label="Sort stays"
          >
            <option value="newest">Newest first</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </div>
      </Reveal>

      <div className="mt-10">
        <ListingGrid listings={sorted} loading={loading} error={error} />
      </div>

      {!loading && !error && listings.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center rounded-4xl bg-white px-6 py-20 text-center ring-1 ring-black/5"
        >
          <motion.span
            animate={{ rotate: [0, -8, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1 }}
            className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50"
          >
            <SearchX className="h-9 w-9 text-emerald-600" />
          </motion.span>
          <h2 className="mt-6 font-display text-3xl text-ink">No stays match your search</h2>
          <p className="mt-2 text-gray-500">Try another city, a different type of stay or fewer guests.</p>
          <Link
            to="/stays"
            className="mt-8 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            Clear search
          </Link>
        </motion.div>
      )}
    </div>
  )
}
