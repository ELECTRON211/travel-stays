import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Check, Eye, EyeOff, Loader2, Lock, LockKeyhole, ShieldAlert, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { changePassword } from '../lib/profile'
import { friendlyAuthError } from '../lib/authErrors'
import { ease } from '../lib/motion'
import { Alert } from '../components/AuthShell'
import PasswordShell from '../components/PasswordShell'

const STRENGTH = [
  { label: 'Too short', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Weak', color: 'bg-red-500', text: 'text-red-600' },
  { label: 'Fair', color: 'bg-amber-500', text: 'text-amber-700' },
  { label: 'Good', color: 'bg-emerald-500', text: 'text-emerald-700' },
  { label: 'Strong', color: 'bg-emerald-700', text: 'text-emerald-800' },
]

// 0 (too short) to 4 (strong).
function strengthOf(password) {
  if (password.length < 6) return 0
  const points = [
    password.length >= 10,
    /[a-z]/.test(password) && /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length
  return Math.min(1 + points, 4)
}

function PasswordInput({ label, value, onChange, show, autoFocus }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <span className="mt-1.5 flex items-center gap-3 rounded-2xl bg-white px-4 ring-1 ring-black/10 transition-shadow focus-within:ring-2 focus-within:ring-emerald-500">
        <Lock className="h-5 w-5 text-stone-400" />
        <input
          type={show ? 'text' : 'password'}
          className="w-full bg-transparent py-3.5 text-sm text-stone-900 outline-none"
          value={value}
          onChange={onChange}
          autoComplete="new-password"
          autoFocus={autoFocus}
        />
      </span>
    </label>
  )
}

function Requirement({ met, children }) {
  return (
    <li className={`flex items-center gap-2 text-sm transition-colors ${met ? 'text-emerald-800' : 'text-stone-400'}`}>
      <motion.span
        animate={{ scale: met ? [1, 1.25, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={`grid h-4 w-4 place-items-center rounded-full ${met ? 'bg-emerald-700 text-white' : 'bg-stone-200'}`}
      >
        {met && <Check className="h-3 w-3" strokeWidth={3} />}
      </motion.span>
      {children}
    </li>
  )
}

// The reset email links here. Supabase signs the user in from the link, so if
// there's no session the link was invalid or has expired.
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [done, setDone] = useState(false)

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-sand">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (done) {
    return (
      <PasswordShell step={4} icon={ShieldCheck} title="Password updated" subtitle="You're all set. Use your new password next time you log in.">
        <Link
          to="/"
          className="block rounded-full bg-emerald-800 py-3.5 text-center font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-900"
        >
          Continue to Travel &amp; Stays
        </Link>
      </PasswordShell>
    )
  }

  if (!user) {
    return (
      <PasswordShell
        step={2}
        icon={ShieldAlert}
        title="This link has expired"
        subtitle="Reset links work once and only for 1 hour. Request a new one and use it straight away."
      >
        <Link
          to="/forgot-password"
          className="block rounded-full bg-emerald-800 py-3.5 text-center font-semibold text-white transition hover:bg-emerald-900"
        >
          Send me a new link
        </Link>
      </PasswordShell>
    )
  }

  const strength = strengthOf(password)
  const level = STRENGTH[strength]
  const requirements = [
    { met: password.length >= 6, label: 'At least 6 characters' },
    { met: /\d/.test(password), label: 'Contains a number' },
    { met: /[a-z]/.test(password) && /[A-Z]/.test(password), label: 'Upper and lower case letters' },
    { met: password.length > 0 && password === confirm, label: 'Both passwords match' },
  ]
  const canSave = password.length >= 6 && password === confirm

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!canSave) return setError('Make sure your password has at least 6 characters and both boxes match.')

    setSaving(true)
    try {
      await changePassword(password)
      toast.show({ title: 'Password changed', description: 'Your account is secure with your new password.' })
      setDone(true)
      setTimeout(() => navigate('/', { replace: true }), 2500)
    } catch (err) {
      setError(friendlyAuthError(err).message)
      setSaving(false)
    }
  }

  return (
    <PasswordShell
      step={3}
      icon={LockKeyhole}
      title="Create a new password"
      subtitle={
        <>
          For <span className="font-medium text-stone-700">{user.email}</span>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}

        <div>
          <PasswordInput
            label="New password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            show={show}
            autoFocus
          />
          {/* Strength meter */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex flex-1 gap-1.5">
              {[1, 2, 3, 4].map((segment) => (
                <span key={segment} className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <motion.span
                    className={`block h-full rounded-full ${level.color}`}
                    initial={false}
                    animate={{ width: password && strength >= segment ? '100%' : '0%' }}
                    transition={{ duration: 0.35, ease }}
                  />
                </span>
              ))}
            </div>
            <span className={`w-16 text-right text-xs font-semibold ${password ? level.text : 'text-stone-300'}`}>
              {password ? level.label : 'Strength'}
            </span>
          </div>
        </div>

        <PasswordInput
          label="Confirm new password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          show={show}
        />

        <ul className="grid gap-2 rounded-2xl bg-stone-50 p-4 sm:grid-cols-2">
          {requirements.map(({ met, label }) => (
            <Requirement key={label} met={met}>
              {label}
            </Requirement>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setShow(!show)}
          className="flex items-center gap-1.5 text-sm font-medium text-stone-600 hover:text-stone-900"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {show ? 'Hide passwords' : 'Show passwords'}
        </button>

        <button
          disabled={saving || !canSave}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-900 disabled:opacity-50"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </PasswordShell>
  )
}
