import { useEffect, useState } from 'react'
import { useAuth } from './AuthContext'
import { SavedContext } from './SavedContext'
import { fetchSavedIds, saveListing, unsaveListing } from '../lib/saved'

const EMPTY = new Set()

// Keeps the set of saved listing ids in memory so every heart button on the
// page agrees, and updates it instantly when the user taps one.
export default function SavedProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id
  const [state, setState] = useState({ userId: null, ids: EMPTY })

  useEffect(() => {
    if (!userId) return
    let ignore = false
    fetchSavedIds(userId)
      .then((ids) => {
        if (!ignore) setState({ userId, ids })
      })
      .catch((error) => console.error('Failed to load saved listings:', error.message))
    return () => {
      ignore = true
    }
  }, [userId])

  const ids = state.userId === userId ? state.ids : EMPTY

  async function toggle(listingId) {
    const wasSaved = ids.has(listingId)
    const next = new Set(ids)
    if (wasSaved) next.delete(listingId)
    else next.add(listingId)
    setState({ userId, ids: next }) // update the heart straight away

    try {
      if (wasSaved) await unsaveListing(userId, listingId)
      else await saveListing(listingId)
    } catch (error) {
      setState({ userId, ids }) // put it back if the server said no
      throw error
    }
  }

  const value = {
    isSaved: (listingId) => ids.has(listingId),
    toggle,
    count: ids.size,
  }

  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>
}
