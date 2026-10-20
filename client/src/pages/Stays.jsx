import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { ListingGrid } from '../components/ListingCard'
import { useListings } from '../hooks/useListings'

const sorters = {
  newest: () => 0, // already ordered newest-first by the query
  'price-asc': (a, b) => (a.price_per_night ?? 0) - (b.price_per_night ?? 0),
  'price-desc': (a, b) => (b.price_per_night ?? 0) - (a.price_per_night ?? 0),
}

export default function Stays() {
  const [searchParams] = useSearchParams()
  const city = searchParams.get('city') ?? ''
  const guests = searchParams.get('guests') ?? ''
  const [sort, setSort] = useState('newest')

  const { listings, loading, error } = useListings({ city, guests })
  const sorted = [...listings].sort(sorters[sort])

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* key= resets the form fields when the URL search changes */}
      <SearchBar key={searchParams.toString()} initial={Object.fromEntries(searchParams)} />

      <div className="mb-6 mt-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {city ? `Stays in ${city}` : 'All stays'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {loading
              ? 'Searching…'
              : `${listings.length} ${listings.length === 1 ? 'place' : 'places'} found${
                  guests ? ` for ${guests}+ guests` : ''
                }`}
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-gray-600">
          Sort by
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          >
            <option value="newest">Newest</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
          </select>
        </label>
      </div>

      <ListingGrid listings={sorted} loading={loading} error={error} />

      {!loading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
          <SearchX className="h-12 w-12 text-gray-300" />
          <h2 className="mt-4 font-semibold text-gray-900">No stays match your search</h2>
          <p className="mt-1 text-sm text-gray-500">Try another city or fewer guests.</p>
          <Link to="/stays" className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            Clear search
          </Link>
        </div>
      )}
    </div>
  )
}
