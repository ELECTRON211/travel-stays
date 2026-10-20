import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import AuthShell, { Alert, TextField } from '../components/AuthShell'

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const redirectTo = location.state?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (user) return <Navigate to={redirectTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setSubmitting(false)

    if (error) setError(error.message)
    else navigate(redirectTo, { replace: true })
  }

  return (
    <AuthShell title="Welcome back" subtitle="Log in to manage your trips and bookings.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
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
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />
        <button
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-500">
        New to Travel &amp; Stays?{' '}
        <Link to="/signup" className="font-semibold text-emerald-700 hover:text-emerald-800">
          Create an account
        </Link>
      </p>
    </AuthShell>
  )
}
