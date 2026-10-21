import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Mail } from 'lucide-react'
import { supabase } from '../lib/supabase'
import AuthShell, { Alert, TextField } from '../components/AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    // The email link brings the user back to /reset-password to choose a new one.
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setSubmitting(false)

    if (error) setError(error.message)
    else setSent(true)
  }

  if (sent) {
    return (
      <AuthShell title="Check your inbox" subtitle={`We've sent reset instructions to ${email}.`}>
        {/* Same message whether or not the email exists, so nobody can test which emails have accounts. */}
        <Alert type="success">
          If an account exists for that email, you'll get a link to reset your password in the next few minutes. Check
          your spam folder too.
        </Alert>
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
    <AuthShell title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
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
        <button
          disabled={submitting}
          className="w-full rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <Link
        to="/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to log in
      </Link>
    </AuthShell>
  )
}
