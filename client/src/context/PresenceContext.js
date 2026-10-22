import { createContext, useContext } from 'react'

// { online: [{ user_id, role, page, online_at }] } — everyone with the site open right now.
export const PresenceContext = createContext({ online: [] })

export const usePresence = () => useContext(PresenceContext)
