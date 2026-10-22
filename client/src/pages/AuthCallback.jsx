import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { setInitialRole, takePendingRole } from '../lib/admin'
import AuthShell, { Alert } from '../components/AuthShell'

// Google may send back an error in the query string or the #hash.
function errorFromUrl() {
  const params = new URLSearchParams(window.location.search)
  const hash = new URLSearchParams(window.location.hash.slice(1))
  return params.get('error_description') || hash.get('error_description') || ''
}

// Google sends people here after they approve the sign-in. Supabase reads
// the login from the URL by itself; this page waits for it, applies the
// role picked on the sign-up page, then heads home.
export default function AuthCallback() {
  const { user, loading, refreshProfile } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [error, setError] = useState(errorFromUrl)
  const handled = useRef(false)

  useEffect(() => {
    if (error || loading || !user || handled.current) return
    handled.current = true

    const role = takePendingRole()
    ;(async () => {
      if (role && role !== 'traveler') {
        try {
          await setInitialRole(role)
          refreshProfile()
        } catch (err) {
          console.warn('Could not apply the chosen role:', err.message)
        }
      }
      const firstName = user.fullName.split(' ')[0]
      toast.show({
        title: `Welcome${firstName ? `, ${firstName}` : ''}!`,
        description: "You're signed in with Google.",
      })
      navigate('/', { replace: true })
    })()
  }, [error, loading, user, refreshProfile, toast, navigate])

  // If nothing happens within 15 seconds, stop waiting and say so.
  useEffect(() => {
    if (error || user) return
    const timer = setTimeout(() => setError('We could not finish signing you in. Please try again.'), 15000)
    return () => clearTimeout(timer)
  }, [error, user])

  if (error) {
    return (
      <AuthShell title="Sign-in didn't finish" subtitle="Google couldn't complete the sign-in.">
        <Alert>{error}</Alert>
        <Link
          to="/login"
          className="mt-6 block rounded-xl bg-emerald-800 py-3 text-center font-semibold text-white hover:bg-emerald-900"
        >
          Back to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <div className="grid min-h-screen place-items-center bg-stone-50">
      <div className="flex flex-col items-center gap-4 text-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-700" />
        <p className="font-display text-2xl text-stone-900">Signing you in…</p>
        <p className="text-sm text-stone-500">Just a moment while we connect your Google account.</p>
      </div>
    </div>
  )
}
