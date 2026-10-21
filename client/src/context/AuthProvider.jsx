import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import { IDLE_TIMEOUT_MINUTES, clearActivity } from '../lib/session'
import { useToast } from './ToastContext'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileVersion, setProfileVersion] = useState(0) // bump to re-load the profile after edits
  const toast = useToast()
  const navigate = useNavigate()

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
  }, [session, profileVersion])

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
        phone: activeProfile?.phone ?? '',
        bio: activeProfile?.bio ?? '',
        createdAt: activeProfile?.created_at ?? session.user.created_at,
        emailConfirmed: Boolean(session.user.email_confirmed_at),
      }
    : null

  const value = {
    user,
    loading,
    // Logs out on this device and leaves the page. Options:
    //   reason: 'idle'      → the "logged out for your security" message
    //   redirectTo / state  → where to go afterwards (home by default)
    signOut: async ({ reason, redirectTo = '/', state } = {}) => {
      clearActivity()
      // 'local' clears the session on this device immediately, without
      // waiting on the server — so logging out works even on a bad connection.
      const { error } = await supabase.auth.signOut({ scope: 'local' })
      if (error) console.error('Sign out problem (logged out locally anyway):', error.message)
      setSession(null)
      setProfile(null)
      navigate(redirectTo, { replace: true, state })
      toast.show(
        reason === 'idle'
          ? {
              type: 'info',
              title: 'Logged out for your security',
              description: `You were inactive for ${IDLE_TIMEOUT_MINUTES} minutes.`,
              duration: 6000,
            }
          : { type: 'logout', title: "You've been logged out", description: 'See you on your next trip.' },
      )
    },
    refreshProfile: () => setProfileVersion((v) => v + 1),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
