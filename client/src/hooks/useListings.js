import { useEffect, useState } from 'react'
import { fetchListings } from '../lib/listings'

// Loads listings for a search and re-runs whenever the search changes.
// `loading` is true until the result for the *current* search has arrived.
export function useListings({ city, guests, limit } = {}) {
  const key = JSON.stringify({ city, guests, limit })
  const [result, setResult] = useState({ key: null, listings: [], error: null })

  useEffect(() => {
    let ignore = false

    fetchListings({ city, guests, limit })
      .then((listings) => {
        if (!ignore) setResult({ key, listings, error: null })
      })
      .catch((error) => {
        if (!ignore) setResult({ key, listings: [], error: error.message })
      })

    return () => {
      ignore = true
    }
  }, [key, city, guests, limit])

  return {
    listings: result.listings,
    error: result.error,
    loading: result.key !== key,
  }
}
