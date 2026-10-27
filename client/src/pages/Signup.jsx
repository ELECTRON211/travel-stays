import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { Compass, Home, Lock, Luggage, Mail, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { markActive } from '../lib/session'
import { friendlyAuthError } from '../lib/authErrors'
import { useCooldown } from '../hooks/useCooldown'
import { images, videoReels } from '../lib/images'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import AuthShell, { Alert, TextField } from '../components/AuthShell'
import TypeWriter from '../components/TypeWriter'
import GoogleButton from '../components/GoogleButton'
import EmailCodeForm from '../components/EmailCodeForm'

const roles = [
  { value: 'traveler', label: 'Traveler', text: 'Book stays and tours', icon: Luggage },
  { value: 'host', label: 'Host', text: 'List a property', icon: Home },
  { value: 'guide', label: 'Tour guide', text: 'Offer experiences', icon: Compass },
]

export default function Signup() {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/' // the page they were trying to open
  const [searchParams] = useSearchParams()
  const presetRole = roles.some((r) => r.value === searchParams.get('role')) ? searchParams.get('role') : 'traveler'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(presetRole)
  const [error, setError] = useState('')
  const [confirmEmail, setConfirmEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useCooldown()

  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // full_name and role are stored on the auth user; a database trigger
    // copies them into the `profiles` table (see supabase/schema.sql).
    markActive() // fresh inactivity clock for the new session
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    setSubmitting(false)

    if (error) {
      const friendly = friendlyAuthError(error)
      setError(friendly.message)
      if (friendly.wait) setCooldown(friendly.wait)
    } else if (data.session) {
      toast.show({
        title: `Welcome to Travel & Stays, ${fullName.trim().split(' ')[0]}!`,
        description: 'Your account is ready.',
      })
      navigate(redirectTo, { replace: true })
    }
    else setConfirmEmail(true) // email confirmation is switched on in Supabase
  }

  if (confirmEmail) {
    return (
      <AuthShell title="Enter your code" subtitle="One last step to confirm your email address.">
        <EmailCodeForm
          email={email.trim()}
          onVerified={() => {
            markActive()
            toast.show({
              title: `Welcome to Travel & Stays, ${fullName.trim().split(' ')[0]}!`,
              description: 'Your email is confirmed and your account is ready.',
            })
            navigate(redirectTo, { replace: true })
          }}
        />
        <button
          type="button"
          onClick={() => setConfirmEmail(false)}
          className="mt-4 w-full text-center text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          Use a different email
        </button>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join as a traveler, host or tour guide."
      image={images.signup}
      video={videoReels.signup}
      quote={
        <>
          Find a stay you'll love, or <em className="text-emerald-300"><TypeWriter text="earn from your space." /></em>
        </>
      }
      quoteNote="Free to join. It takes less than a minute."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {location.state?.from && !error && (
          <Alert type="success">Create a free account to see stays, tours and prices. It takes less than a minute.</Alert>
        )}
        {error && <Alert>{error}</Alert>}

        <fieldset>
          <legend className="text-sm font-medium text-stone-700">I want to join as</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {roles.map(({ value, label, text, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className="relative rounded-2xl bg-white p-3 text-left ring-1 ring-black/10 transition hover:ring-black/20"
              >
                {role === value && (
                  <motion.span
                    layoutId="role-highlight"
                    className="absolute inset-0 rounded-2xl bg-emerald-50 ring-2 ring-emerald-500"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative block">
                  <Icon className={`h-5 w-5 transition-colors ${role === value ? 'text-emerald-600' : 'text-stone-400'}`} />
                  <span className="mt-2 block text-sm font-semibold text-stone-900">{label}</span>
                  <span className="block text-xs text-stone-500">{text}</span>
                </span>
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <GoogleButton role={role} onError={setError} />
        </div>

        <TextField
          icon={User}
          label="Full name"
          placeholder="Ada Okafor"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          required
        />
        <TextField
          icon={Mail}
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <TextField
          icon={Lock}
          label="Password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />

        <button
          disabled={submitting || cooldown > 0}
          className="w-full rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : cooldown > 0 ? `Try again in ${cooldown}s` : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="font-semibold text-emerald-700 hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
