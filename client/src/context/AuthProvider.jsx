import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  // 1. Restore the session on page load, then keep listening for login/logout.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  // 2. Whenever the logged-in user changes, load their row from `profiles`.
  useEffect(() => {
    if (!session) return
    let ignore = false

    supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('Failed to load profile:', error.message)
        if (!ignore) setProfile(data)
      })

    return () => {
      ignore = true
    }
  }, [session])

  // Only trust the profile if it belongs to the current user (avoids showing
  // the previous user's name for a moment after switching accounts). If the
  // profile row is missing, fall back to the details saved at sign-up.
  const activeProfile = profile?.id === session?.user.id ? profile : null
  const metadata = session?.user.user_metadata ?? {}

  const user = session
    ? {
        id: session.user.id,
        email: session.user.email,
        fullName: activeProfile?.full_name ?? metadata.full_name ?? '',
        role: activeProfile?.role ?? metadata.role ?? 'traveler',
      }
    : null

  const value = {
    user,
    loading,
    signOut: () => supabase.auth.signOut(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
