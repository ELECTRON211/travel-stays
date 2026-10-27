import { useState } from 'react'
import { motion } from 'motion/react'
import { CheckCircle2, Loader2, Send } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { CONTACT_SUBJECTS, sendContactMessage } from '../lib/safety'
import { Alert } from './AuthShell'

const inputClass =
  'mt-1.5 w-full rounded-xl bg-white px-4 py-3 text-sm text-stone-900 ring-1 ring-stone-300 outline-none transition focus:ring-2 focus:ring-emerald-700'

// The Help centre's contact form. Messages go to the admin dashboard, so no
// personal email address is shown on the site.
export default function ContactForm() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    name: user?.fullName ?? '',
    email: user?.email ?? '',
    subject: 'booking',
    bookingRef: '',
    message: '',
  })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.message.trim().length < 10) return setError('Please tell us a little more (at least 10 characters).')
    setSending(true)
    try {
      await sendContactMessage(form)
      setSentTo(form.email.trim())
      setForm((f) => ({ ...f, message: '', bookingRef: '' }))
    } catch (err) {
      setError(err.message)
    }
    setSending(false)
  }

  if (sentTo) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center rounded-2xl bg-emerald-50 p-8 text-center ring-1 ring-emerald-200"
      >
        <CheckCircle2 className="h-10 w-10 text-emerald-700" />
        <p className="mt-3 font-display text-2xl text-stone-900">Message sent</p>
        <p className="mt-1 text-sm text-stone-600">
          Thanks — we usually reply within one working day, to <strong>{sentTo}</strong>.
        </p>
        <button
          type="button"
          onClick={() => setSentTo('')}
          className="mt-5 text-sm font-semibold text-emerald-800 hover:underline"
        >
          Send another message
        </button>
      </motion.div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Your name</span>
          <input className={inputClass} value={form.name} onChange={update('name')} maxLength={100} required />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Email for our reply</span>
          <input type="email" className={inputClass} value={form.email} onChange={update('email')} maxLength={200} required />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-stone-700">What is it about?</span>
          <select className={inputClass} value={form.subject} onChange={update('subject')}>
            {CONTACT_SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-stone-700">Booking reference (optional)</span>
          <input
            className={inputClass}
            value={form.bookingRef}
            onChange={update('bookingRef')}
            maxLength={20}
            placeholder="e.g. A1B2C3D4"
          />
        </label>
      </div>
      <label className="block">
        <span className="text-sm font-medium text-stone-700">Your message</span>
        <textarea
          className={inputClass}
          rows={5}
          value={form.message}
          onChange={update('message')}
          maxLength={2000}
          placeholder="How can we help?"
          required
        />
      </label>
      {error && <Alert>{error}</Alert>}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-stone-500">In danger right now? Call 112 first.</p>
        <button
          disabled={sending}
          className="flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {sending ? 'Sending…' : 'Send message'}
        </button>
      </div>
    </form>
  )
}
