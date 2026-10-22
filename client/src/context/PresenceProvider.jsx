import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { touchLastSeen } from '../lib/admin'
import { useAuth } from './AuthContext'
import { PresenceContext } from './PresenceContext'

const HEARTBEAT_MS = 5 * 60 * 1000

// Tracks who is online right now using Supabase Realtime "presence": every
// logged-in tab joins one shared channel and announces only its user id,
// role and current page. When a tab closes, Supabase drops it automatically.
// Also records "last seen" in the database every few minutes, which is what
// the admin dashboard uses for "active in the last 24 hours / 7 days".
export default function PresenceProvider({ children }) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [online, setOnline] = useState([])
  const channelRef = useRef(null)
  const pageRef = useRef(pathname)

  const userId = user?.id
  const role = user?.role

  // 1. Join the channel while logged in.
  useEffect(() => {
    if (!userId) return

    const channel = supabase.channel('online-users', { config: { presence: { key: userId } } })
    channelRef.current = channel

    channel
      .on('presence', { event: 'sync' }, () => {
        // One entry per user, even if they have several tabs open.
        const state = channel.presenceState()
        setOnline(Object.values(state).map((metas) => metas[0]))
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          channel.track({ user_id: userId, role, page: pageRef.current, online_at: new Date().toISOString() })
        }
      })

    return () => {
      channelRef.current = null
      setOnline([])
      supabase.removeChannel(channel)
    }
  }, [userId, role])

  // 2. Update the page shown on the dashboard as the user moves around.
  useEffect(() => {
    pageRef.current = pathname
    const channel = channelRef.current
    if (!channel || channel.state !== 'joined') return
    channel.track({ user_id: userId, role, page: pathname, online_at: new Date().toISOString() })
  }, [pathname, userId, role])

  // 3. "Last seen" heartbeat while the tab is visible.
  useEffect(() => {
    if (!userId) return
    touchLastSeen()
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') touchLastSeen()
    }, HEARTBEAT_MS)
    return () => clearInterval(timer)
  }, [userId])

  return <PresenceContext.Provider value={{ online }}>{children}</PresenceContext.Provider>
}
