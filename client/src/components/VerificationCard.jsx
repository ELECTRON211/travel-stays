import { useEffect, useMemo, useState } from 'react'
import { motion } from 'motion/react'
import { BadgeCheck, Camera, Clock, FileText, IdCard, ImageUp, Loader2, ScanFace, ShieldCheck, XCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { ID_TYPES, fetchMyVerification, idTypeLabel, submitVerification } from '../lib/safety'
import { fadeUp } from '../lib/motion'
import { Alert } from './AuthShell'
import CameraCapture from './CameraCapture'

const MAX_BYTES = 5 * 1024 * 1024

// One of the two matching boxes: ID photo or selfie, with a live preview.
function PhotoSlot({ step, title, hint, icon: Icon, file, accept, onFile, onCamera, cameraFirst, cameraLabel }) {
  const preview = useMemo(() => (file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null), [file])
  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview])

  const uploadButton = (primary) => (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        primary ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900'
      }`}
    >
      <ImageUp className="h-4 w-4" /> {primary ? 'Upload photo' : 'Upload instead'}
      <input type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
    </label>
  )
  const cameraButton = (primary) => (
    <button
      type="button"
      onClick={onCamera}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
        primary ? 'bg-emerald-800 text-white hover:bg-emerald-900' : 'text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900'
      }`}
    >
      <Camera className="h-4 w-4" /> {cameraLabel}
    </button>
  )

  return (
    <div className="flex flex-col rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200">
      <p className="flex items-center gap-2 text-sm font-semibold text-stone-900">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-emerald-800 text-xs text-white">{step}</span>
        {title}
      </p>
      <div className="mt-3 grid aspect-4/3 place-items-center overflow-hidden rounded-xl bg-white ring-1 ring-stone-200">
        {preview ? (
          <img src={preview} alt={title} className="h-full w-full object-cover" />
        ) : file ? (
          <span className="flex flex-col items-center gap-2 p-4 text-center text-sm text-stone-600">
            <FileText className="h-8 w-8 text-emerald-700" /> {file.name}
          </span>
        ) : (
          <span className="flex flex-col items-center gap-2 p-4 text-center text-sm text-stone-500">
            <Icon className="h-10 w-10 text-stone-300" strokeWidth={1.5} /> {hint}
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {cameraFirst ? (
          <>
            {cameraButton(true)}
            {uploadButton(false)}
          </>
        ) : (
          <>
            {uploadButton(true)}
            {cameraButton(false)}
          </>
        )}
      </div>
    </div>
  )
}

// Hosts and guides send an ID + selfie; an admin compares the two and grants the Verified badge.
export default function VerificationCard() {
  const { user, refreshProfile } = useAuth()
  const toast = useToast()
  const { data: request, loading, reload } = useAsync(() => fetchMyVerification(user.id), user.id)
  const [idType, setIdType] = useState('nin')
  const [idFile, setIdFile] = useState(null)
  const [selfieFile, setSelfieFile] = useState(null)
  const [cameraFor, setCameraFor] = useState(null) // 'id' | 'selfie' | null
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!idFile || !selfieFile) return setError('Add both a photo of your ID and a selfie.')
    if (idFile.size > MAX_BYTES || selfieFile.size > MAX_BYTES) return setError('Each photo must be under 5 MB.')
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
      <form onSubmit={handleSubmit} className="space-y-5">
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
          {user.role === 'guide' ? ' tour' : ' listing'}. Your photos are stored privately and only our review team can see them.
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

        <div className="grid gap-4 sm:grid-cols-2">
          <PhotoSlot
            step="1"
            title="Photo of your ID"
            hint="All four corners visible, no glare"
            icon={IdCard}
            file={idFile}
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onFile={setIdFile}
            onCamera={() => setCameraFor('id')}
            cameraLabel="Use camera"
          />
          <PhotoSlot
            step="2"
            title="Your selfie"
            hint="Face the camera in good light"
            icon={ScanFace}
            file={selfieFile}
            accept="image/jpeg,image/png,image/webp"
            onFile={setSelfieFile}
            onCamera={() => setCameraFor('selfie')}
            cameraFirst
            cameraLabel="Take a selfie"
          />
        </div>
        <p className="flex items-center gap-2 text-xs text-stone-500">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          We compare the two photos: your face in the selfie must match the photo on your ID.
        </p>

        {error && <Alert>{error}</Alert>}
        <button
          disabled={sending}
          className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />}
          {sending ? 'Uploading…' : 'Send for review'}
        </button>

        <CameraCapture
          open={cameraFor !== null}
          facingMode={cameraFor === 'id' ? 'environment' : 'user'}
          title={cameraFor === 'id' ? 'Photograph your ID' : 'Take a selfie'}
          onCapture={cameraFor === 'id' ? setIdFile : setSelfieFile}
          onClose={() => setCameraFor(null)}
        />
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
