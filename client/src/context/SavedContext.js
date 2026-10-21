import { createContext, useContext } from 'react'

export const SavedContext = createContext(null)

// useSaved().isSaved(id) / .toggle(id) — the logged-in user's wishlist.
export function useSaved() {
  return useContext(SavedContext)
}
