import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { KeyRound, Loader2, Mail, MailCheck, RotateCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Alert, TextField } from '../components/AuthShell'
import PasswordShell from '../components/PasswordShell'

const RESEND_SECONDS = 60

async function sendResetEmail(email) {
  // The email link brings the user back to /reset-password to choose a new one.
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })
  if (error) throw error
}

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Count down until "Resend" is allowed again.
  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000)
    return () => clearTimeout(timer)
  }, [cooldown])

  async function send() {
    setError('')
    setSubmitting(true)
    try {
      await sendResetEmail(email.trim())
      setSent(true)
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    send()
  }

  if (sent) {
    return (
      <PasswordShell step={2} icon={MailCheck} title="Check your inbox" subtitle="We've sent you a link to reset your password.">
        <div className="rounded-2xl bg-emerald-50 p-4 text-center ring-1 ring-emerald-100">
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-emerald-700 shadow-sm"
          >
            <Mail className="h-6 w-6" />
          </motion.div>
          <p className="mt-3 text-sm text-emerald-900">
            If an account exists for <strong className="break-all">{email.trim()}</strong>, a reset link is on its way.
          </p>
        </div>

        {/* Same message whether or not the email exists, so nobody can test which emails have accounts. */}
        <ul className="mt-6 space-y-2.5 text-sm text-stone-600">
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-bold">1</span>
            Open the email from Travel &amp; Stays (it can take a minute or two).
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-bold">2</span>
            Click the reset link — it works once and expires after 1 hour.
          </li>
          <li className="flex gap-2.5">
            <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-stone-100 text-[11px] font-bold">3</span>
            Can't find it? Check your spam or promotions folder.
          </li>
        </ul>

        {error && (
          <div className="mt-5">
            <Alert>{error}</Alert>
          </div>
        )}

        <button
          type="button"
          onClick={send}
          disabled={cooldown > 0 || submitting}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:cursor-not-allowed disabled:text-stone-400 disabled:hover:ring-stone-300"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {cooldown > 0 ? `Resend email in ${cooldown}s` : 'Resend email'}
        </button>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-3 w-full text-center text-sm font-medium text-stone-500 hover:text-stone-900"
        >
          Use a different email
        </button>
      </PasswordShell>
    )
  }

  return (
    <PasswordShell
      step={1}
      icon={KeyRound}
      title="Forgot your password?"
      subtitle="No worries. Enter the email you signed up with and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <TextField
          icon={Mail}
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          autoFocus
          required
        />
        <button
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Sending link…' : 'Send reset link'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-stone-500">
        Remembered it?{' '}
        <Link to="/login" className="font-semibold text-emerald-800 hover:text-emerald-900">
          Log in
        </Link>
      </p>
    </PasswordShell>
  )
}
