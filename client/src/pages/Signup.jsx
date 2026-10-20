import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { Compass, Home, Lock, Luggage, Mail, User } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AuthShell, { Alert, TextField } from '../components/AuthShell'

const roles = [
  { value: 'traveler', label: 'Traveler', text: 'Book stays and tours', icon: Luggage },
  { value: 'host', label: 'Host', text: 'List a property', icon: Home },
  { value: 'guide', label: 'Tour guide', text: 'Offer experiences', icon: Compass },
]

export default function Signup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const presetRole = roles.some((r) => r.value === searchParams.get('role')) ? searchParams.get('role') : 'traveler'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState(presetRole)
  const [error, setError] = useState('')
  const [confirmEmail, setConfirmEmail] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to="/" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // full_name and role are stored on the auth user; a database trigger
    // copies them into the `profiles` table (see supabase/schema.sql).
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName.trim(), role } },
    })
    setSubmitting(false)

    if (error) setError(error.message)
    else if (data.session) navigate('/', { replace: true })
    else setConfirmEmail(true) // email confirmation is switched on in Supabase
  }

  if (confirmEmail) {
    return (
      <AuthShell title="Check your email" subtitle={`We sent a confirmation link to ${email}.`}>
        <Alert type="success">Click the link in the email to activate your account, then log in.</Alert>
        <Link
          to="/login"
          className="mt-6 block rounded-xl bg-emerald-600 py-3 text-center font-semibold text-white hover:bg-emerald-700"
        >
          Go to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell title="Create your account" subtitle="Join as a traveler, host or tour guide.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}

        <fieldset>
          <legend className="text-sm font-medium text-gray-700">I want to join as</legend>
          <div className="mt-1.5 grid grid-cols-3 gap-2">
            {roles.map(({ value, label, text, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                aria-pressed={role === value}
                className={`rounded-xl border p-3 text-left transition ${
                  role === value
                    ? 'border-emerald-600 bg-emerald-50 ring-2 ring-emerald-600/20'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Icon className={`h-5 w-5 ${role === value ? 'text-emerald-600' : 'text-gray-400'}`} />
                <span className="mt-2 block text-sm font-semibold text-gray-900">{label}</span>
                <span className="block text-xs text-gray-500">{text}</span>
              </button>
            ))}
          </div>
        </fieldset>

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
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
        >
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Already have an account?{' '}
        <Link to="/login" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Log in
        </Link>
      </p>
    </AuthShell>
  )
}
