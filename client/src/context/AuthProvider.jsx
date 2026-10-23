import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { AuthContext } from './AuthContext'
import { clearActivity, clearStoredAuth } from '../lib/session'

export default function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileVersion, setProfileVersion] = useState(0) // bump to re-load the profile after edits
  const navigate = useNavigate()
  const signingOut = useRef(false)

  // Logs out on this device. Options:
  //   redirectTo / state  → where to go afterwards. By default the "logged
  //                         out" page, so it's always obvious it worked;
  //                         state { reason: 'idle' } changes its message.
  const signOut = useCallback(
    async ({ redirectTo = '/logged-out', state } = {}) => {
      signingOut.current = true
      clearActivity()

      // 1. Forget the user in the app and leave the page straight away, so
      //    the navbar and protected pages update even if the network or
      //    Supabase's auth lock is slow.
      // React Router runs navigation as a transition. Clearing the user in the
      // same transition means both land in one render — otherwise a
      // protected page would briefly see "no user" and bounce to /login
      // before the redirect below takes effect.
      navigate(redirectTo, { replace: true, state })
      startTransition(() => {
        setSession(null)
        setProfile(null)
      })

      // 2. Remove the stored tokens from this device. 'local' needs no server
      //    round-trip; the timeout stops a stuck call from hanging, and the
      //    manual wipe guarantees nothing is left behind either way.
      try {
        const timeout = new Promise((resolve) => setTimeout(() => resolve({ error: new Error('timed out') }), 3000))
        const { error } = await Promise.race([supabase.auth.signOut({ scope: 'local' }), timeout])
        if (error) console.warn('Supabase sign-out did not finish cleanly:', error.message)
      } catch (error) {
        console.warn('Supabase sign-out failed:', error.message)
      }
      clearStoredAuth()
    },
    [navigate],
  )

  // 1. Restore the session on page load, then keep listening for login/logout.
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'SIGNED_IN') signingOut.current = false
      // While logging out, ignore anything that would bring the old session
      // back — e.g. a token refresh that was already in flight.
      else if (signingOut.current && newSession) return
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
    signOut,
    refreshProfile: () => setProfileVersion((v) => v + 1),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
