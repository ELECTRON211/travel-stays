import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { changePassword } from '../lib/profile'
import AuthShell, { Alert, TextField } from '../components/AuthShell'

// The reset email links here. Supabase signs the user in from the link, so if
// there's no session the link was invalid or has expired.
export default function ResetPassword() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!user) {
    return (
      <AuthShell title="Link expired" subtitle="This password reset link is invalid or has already been used.">
        <Link
          to="/forgot-password"
          className="block rounded-xl bg-emerald-800 py-3 text-center font-semibold text-white hover:bg-emerald-900"
        >
          Send a new link
        </Link>
      </AuthShell>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password.length < 6) return setError('Use at least 6 characters.')
    if (password !== confirm) return setError("The two passwords don't match.")

    setSaving(true)
    try {
      await changePassword(password)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <AuthShell title="Choose a new password" subtitle={`For ${user.email}`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <Alert>{error}</Alert>}
        <TextField
          icon={Lock}
          label="New password"
          type="password"
          placeholder="At least 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <TextField
          icon={Lock}
          label="Confirm new password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        <button
          disabled={saving}
          className="w-full rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {saving ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  )
}
