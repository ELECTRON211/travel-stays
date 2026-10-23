import { useState } from 'react'
import { motion } from 'motion/react'
import { BadgeCheck, Camera, Clock, FileText, Loader2, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { ID_TYPES, fetchMyVerification, idTypeLabel, submitVerification } from '../lib/safety'
import { fadeUp } from '../lib/motion'
import { Alert } from './AuthShell'

const MAX_BYTES = 5 * 1024 * 1024

function FilePick({ icon: Icon, label, hint, accept, file, onChange }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 ring-stone-300 transition hover:ring-emerald-700">
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-800">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-stone-900">{label}</span>
        <span className="block truncate text-xs text-stone-500">{file ? file.name : hint}</span>
      </span>
      <input type="file" accept={accept} className="hidden" onChange={(e) => onChange(e.target.files[0] ?? null)} />
    </label>
  )
}

// Hosts and guides send an ID + selfie; an admin reviews it and grants the Verified badge.
export default function VerificationCard() {
  const { user, refreshProfile } = useAuth()
  const toast = useToast()
  const { data: request, loading, reload } = useAsync(() => fetchMyVerification(user.id), user.id)
  const [idType, setIdType] = useState('nin')
  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!idFile || !selfieFile) return setError('Add both a photo of your ID and a selfie.')
    if (idFile.size > MAX_BYTES || selfieFile.size > MAX_BYTES) return setError('Each file must be under 5 MB.')
    setSending(true)
    try {
      await submitVerification(user.id, { idType, idFile, selfieFile })
      toast.show({ title: 'Documents sent', description: 'We usually review them within 24 hours.' })
      setIdFile(null)
      setSelfieFile(null)
      reload()
      refreshProfile()
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  let body
  if (loading && request === undefined) {
    body = <div className="shimmer h-24 rounded-xl" />
  } else if (user.verified) {
    body = (
      <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-emerald-900">
        <BadgeCheck className="h-6 w-6 shrink-0 text-emerald-700" />
        <p className="text-sm">
          <strong>You're verified.</strong> Travellers see the Verified badge on your {user.role === 'guide' ? 'tours' : 'listings'}.
        </p>
      </div>
    )
  } else if (request?.status === 'pending') {
    body = (
      <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4 text-amber-900">
        <Clock className="h-6 w-6 shrink-0 text-amber-600" />
        <p className="text-sm">
          <strong>Under review.</strong> We received your {idTypeLabel(request.id_type)} and selfie on{' '}
          {new Date(request.created_at).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })}.
        </p>
      </div>
    )
  } else {
    body = (
      <form onSubmit={handleSubmit} className="space-y-4">
        {request?.status === 'rejected' && (
          <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <XCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Your last request wasn't approved.</strong> {request.reason || 'Please send clearer photos.'} You can try again below.
            </p>
          </div>
        )}
        <p className="text-sm leading-relaxed text-stone-600">
          Verified {user.role === 'guide' ? 'guides' : 'hosts'} get a badge that tells travellers a real, checked person is behind the
          {user.role === 'guide' ? ' tour' : ' listing'}. Your documents are stored privately and only our review team can see them.
        </p>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">ID type</span>
          <select
            value={idType}
            onChange={(e) => setIdType(e.target.value)}
            className="mt-1.5 w-full rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700"
          >
            {ID_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <FilePick icon={FileText} label="Photo of your ID" hint="JPG, PNG or PDF, under 5 MB" accept="image/jpeg,image/png,image/webp,application/pdf" file={idFile} onChange={setIdFile} />
          <FilePick icon={Camera} label="A clear selfie" hint="Face visible, no sunglasses" accept="image/jpeg,image/png,image/webp" file={selfieFile} onChange={setSelfieFile} />
        </div>
        {error && <Alert>{error}</Alert>}
        <button
          disabled={sending}
          className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? 'Uploading…' : 'Send for review'}
        </button>
      </form>
    )
  }

  return (
    <motion.section variants={fadeUp} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
      <h2 className="flex items-center gap-2.5 font-display text-2xl tracking-tight text-stone-900">
        <ShieldCheck className="h-5 w-5 text-emerald-800" /> Identity verification
      </h2>
      <div className="mt-6">{body}</div>
    </motion.section>
  )
}
