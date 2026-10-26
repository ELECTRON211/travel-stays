import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Flag, Loader2, ShieldAlert, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { GUEST_REPORT_CATEGORIES, REPORT_CATEGORIES, submitReport } from '../lib/safety'
import { ease } from '../lib/motion'
import { Alert } from './AuthShell'

// "Report" link + dialog for a listing or tour. Reports go to the admin dashboard.
export default function ReportButton({ targetType, targetId, label = 'Report', className = '' }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState('')
  const [details, setDetails] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  function start() {
    if (!user) return navigate('/login', { state: { from: location.pathname } })
    setCategory('')
    setDetails('')
    setError('')
    setOpen(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!category) return setError('Choose what the problem is.')
    setSending(true)
    try {
      await submitReport({ targetType, targetId, category, details })
      setOpen(false)
      toast.show({ title: 'Thanks for telling us', description: 'Our team will review this report quickly.' })
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={start}
        className={`inline-flex items-center gap-1.5 text-sm font-medium text-stone-500 underline-offset-4 transition hover:text-red-700 hover:underline ${className}`}
      >
        <Flag className="h-4 w-4" /> {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-stone-950/60 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.form
              onSubmit={handleSubmit}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.3, ease }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="report-title"
              className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 id="report-title" className="flex items-center gap-2 font-display text-2xl text-stone-900">
                    <ShieldAlert className="h-6 w-6 text-red-600" /> Report a problem
                  </h2>
                  <p className="mt-1 text-sm text-stone-500">
                    {targetType === 'guest'
                      ? 'Reports are private — the guest won’t see that you reported them.'
                      : 'Reports are private — the host or guide won’t see who sent them.'}
                  </p>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-stone-100" aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-5 rounded-xl bg-red-50 p-3 text-sm text-red-800">
                In danger right now? Call <strong>112</strong> (emergency) first, then tell us.
              </div>

              <fieldset className="mt-5 space-y-2">
                <legend className="text-sm font-medium text-stone-700">What's wrong?</legend>
                {(targetType === 'guest' ? GUEST_REPORT_CATEGORIES : REPORT_CATEGORIES).map((c) => (
                  <label
                    key={c.value}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ring-1 transition ${
                      category === c.value ? 'bg-red-50 ring-red-300' : 'ring-stone-200 hover:ring-stone-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={c.value}
                      checked={category === c.value}
                      onChange={() => setCategory(c.value)}
                      className="mt-1 accent-red-600"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-stone-900">{c.label}</span>
                      <span className="block text-xs text-stone-500">{c.text}</span>
                    </span>
                  </label>
                ))}
              </fieldset>

              <label className="mt-5 block">
                <span className="text-sm font-medium text-stone-700">Details (optional)</span>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="What happened? Dates, messages or anything that helps us check."
                  className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-red-500"
                />
              </label>

              {error && (
                <div className="mt-4">
                  <Alert>{error}</Alert>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between gap-3">
                <Link to="/safety" className="text-sm font-medium text-emerald-800 hover:underline" onClick={() => setOpen(false)}>
                  Safety tips
                </Link>
                <button
                  disabled={sending}
                  className="flex items-center gap-2 rounded-full bg-red-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-60"
                >
                  {sending && <Loader2 className="h-4 w-4 animate-spin" />}
                  {sending ? 'Sending…' : 'Send report'}
                </button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
