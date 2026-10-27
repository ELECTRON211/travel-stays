import { useRef, useState } from 'react'
import { Loader2, MailCheck, RotateCw } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { friendlyAuthError } from '../lib/authErrors'
import { useCooldown } from '../hooks/useCooldown'
import { Alert } from './AuthShell'

const LENGTH = 6
const RESEND_SECONDS = 60

// "Enter the 6-digit code we emailed you." Six boxes that move along as you
// type and fill in at once when you paste. Calls onVerified(session) on success.
export default function EmailCodeForm({ email, onVerified }) {
  const [digits, setDigits] = useState(Array(LENGTH).fill(''))
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resent, setResent] = useState(false)
  const [cooldown, setCooldown] = useCooldown(RESEND_SECONDS) // an email was just sent
  const boxes = useRef([])

  const code = digits.join('')

  function setDigit(index, value) {
    const clean = value.replace(/\D/g, '')
    if (clean.length > 1) {
      // Pasted (or autofilled) the whole code.
      const next = clean.slice(0, LENGTH).split('')
      setDigits([...next, ...Array(LENGTH - next.length).fill('')])
      boxes.current[Math.min(next.length, LENGTH - 1)]?.focus()
      return
    }
    const next = [...digits]
    next[index] = clean
    setDigits(next)
    if (clean && index < LENGTH - 1) boxes.current[index + 1]?.focus()
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) boxes.current[index - 1]?.focus()
  }

  async function verify(e) {
    e.preventDefault()
    setError('')
    if (code.length < LENGTH) return setError(`Enter all ${LENGTH} digits from the email.`)
    setVerifying(true)
    const { data, error: err } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' })
    setVerifying(false)
    if (err) {
      const text = err.message.toLowerCase()
      setError(
        text.includes('expired') || text.includes('invalid')
          ? 'That code is wrong or has expired. Check the latest email, or send a new code.'
          : friendlyAuthError(err).message,
      )
      return
    }
    onVerified(data.session)
  }

  async function resend() {
    setError('')
    setResent(false)
    const { error: err } = await supabase.auth.resend({ type: 'signup', email })
    if (err) {
      const friendly = friendlyAuthError(err)
      setError(friendly.message)
      setCooldown(friendly.wait ?? RESEND_SECONDS)
      return
    }
    setResent(true)
    setDigits(Array(LENGTH).fill(''))
    setCooldown(RESEND_SECONDS)
    boxes.current[0]?.focus()
  }

  return (
    <form onSubmit={verify} className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-100">
        <MailCheck className="h-6 w-6 shrink-0 text-emerald-700" />
        <p>
          We sent a {LENGTH}-digit code to <strong className="break-all">{email}</strong>. It can take a minute — check
          your spam folder too.
        </p>
      </div>

      <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => {
              boxes.current[i] = el
            }}
            value={digit}
            onChange={(e) => setDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={i === 0 ? LENGTH : 1}
            autoFocus={i === 0}
            aria-label={`Digit ${i + 1}`}
            className="h-14 w-full min-w-0 rounded-xl bg-white text-center font-display text-2xl text-stone-900 ring-1 ring-stone-300 outline-none transition focus:ring-2 focus:ring-emerald-700 sm:h-16"
          />
        ))}
      </div>

      {error && <Alert>{error}</Alert>}
      {resent && !error && <Alert type="success">A new code is on its way.</Alert>}

      <button
        disabled={verifying}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
      >
        {verifying && <Loader2 className="h-4 w-4 animate-spin" />}
        {verifying ? 'Checking…' : 'Verify and continue'}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={cooldown > 0}
        className="flex w-full items-center justify-center gap-2 text-sm font-semibold text-emerald-800 transition hover:text-emerald-900 disabled:text-stone-400"
      >
        <RotateCw className="h-4 w-4" />
        {cooldown > 0 ? `Send a new code in ${cooldown}s` : 'Send a new code'}
      </button>
    </form>
  )
}
