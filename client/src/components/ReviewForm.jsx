import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Loader2, MessageSquareReply } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { submitReview } from '../lib/reviews'
import { ease } from '../lib/motion'
import StarRating from './StarRating'
import { Alert } from './AuthShell'

const WORDS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent']
const MAX = 1000

// "Rate your stay" — shown on a finished trip that hasn't been reviewed yet.
export default function ReviewForm({ booking, onSubmitted }) {
  const toast = useToast()
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!rating) return setError('Tap a star to rate your stay.')
    if (comment.trim().length < 10) return setError('Tell future guests a little more (at least 10 characters).')

    setSaving(true)
    try {
      await submitReview(booking.id, rating, comment.trim())
      toast.show({ title: 'Thanks for your review!', description: 'It helps other travellers choose with confidence.' })
      onSubmitted()
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="mt-6 rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/5 ring-1 ring-amber-300/60 sm:p-8"
    >
      <h2 className="font-display text-2xl text-stone-900">How was your stay?</h2>
      <p className="mt-1 text-sm text-stone-500">
        Your review of {booking.listing?.title ?? 'this place'} helps future guests and your host.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <StarRating value={rating} onChange={setRating} size="h-9 w-9" />
        <AnimatePresence mode="wait">
          {rating > 0 && (
            <motion.span
              key={rating}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              className="font-display text-xl text-amber-600"
            >
              {WORDS[rating]}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <label className="mt-6 block">
        <span className="flex justify-between text-sm font-medium text-stone-700">
          Your review
          <span className="text-xs text-stone-400">
            {comment.length}/{MAX}
          </span>
        </span>
        <textarea
          rows={4}
          maxLength={MAX}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="What did you love? Anything future guests should know?"
          className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </label>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      <button
        disabled={saving}
        className="mt-6 flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
      >
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        {saving ? 'Posting…' : 'Post review'}
      </button>
    </motion.form>
  )
}

// The guest's own review, once posted.
export function YourReview({ review }) {
  return (
    <div className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-stone-900/5 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-stone-900">Your review</h2>
        <StarRating value={review.rating} size="h-5 w-5" />
      </div>
      <p className="mt-3 whitespace-pre-line leading-relaxed text-stone-700">{review.comment}</p>
      {review.host_reply && (
        <div className="mt-4 rounded-xl bg-stone-50 p-4 text-sm">
          <p className="flex items-center gap-1.5 font-semibold text-stone-900">
            <MessageSquareReply className="h-4 w-4 text-emerald-800" /> Response from the host
          </p>
          <p className="mt-1 whitespace-pre-line text-stone-600">{review.host_reply}</p>
        </div>
      )}
    </div>
  )
}
