import { fetchListings } from '../lib/listings'
import { useAsync } from './useAsync'

// Loads active listings for a search and re-runs whenever the search changes.
export function useListings({ city, guests, limit } = {}) {
  const { data, error, loading } = useAsync(
    () => fetchListings({ city, guests, limit }),
    JSON.stringify({ city, guests, limit }),
  )

  return { listings: data ?? [], error, loading }
}
