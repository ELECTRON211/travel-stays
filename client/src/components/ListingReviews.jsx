import { useState } from 'react'
import { motion } from 'motion/react'
import { Loader2, MessageSquareReply, Star } from 'lucide-react'
import { useAsync } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import { fetchListingReviews, replyToReview } from '../lib/reviews'
import { initials } from '../lib/format'
import { ease } from '../lib/motion'
import StarRating from './StarRating'
import Reveal from './Reveal'

function monthYear(timestamp) {
  return new Date(timestamp).toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })
}

function ReviewItem({ review, canReply, onReplied }) {
  const toast = useToast()
  const [replying, setReplying] = useState(false)
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)

  async function sendReply() {
    setSaving(true)
    try {
      await replyToReview(review.id, reply)
      toast.show({ title: 'Reply posted', description: 'Guests will see it under this review.' })
      setReplying(false)
      onReplied()
    } catch (err) {
      toast.show({ type: 'error', title: "Couldn't post your reply", description: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-900/5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-full bg-linear-to-br from-emerald-600 to-teal-600 text-sm font-semibold text-white">
          {initials(review.author_name)}
        </span>
        <div>
          <p className="font-semibold text-stone-900">{review.author_name}</p>
          <p className="text-xs text-stone-500">{monthYear(review.created_at)}</p>
        </div>
        <StarRating value={review.rating} size="h-4 w-4" className="ml-auto" />
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

      {canReply && !review.host_reply && !replying && (
        <button
          type="button"
          onClick={() => setReplying(true)}
          className="mt-3 text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          Reply to this review
        </button>
      )}
      {replying && (
        <div className="mt-4 space-y-2">
          <textarea
            rows={3}
            maxLength={1000}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Thank your guest or respond to their feedback…"
            className="w-full rounded-xl px-3 py-2.5 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700"
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setReplying(false)} className="rounded-full px-4 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-100">
              Cancel
            </button>
            <button
              type="button"
              onClick={sendReply}
              disabled={saving || reply.trim().length < 2}
              className="flex items-center gap-2 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Post reply
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Reviews section on a listing page: average, star breakdown and each review.
// The listing's host can reply to reviews that don't have a reply yet.
export default function ListingReviews({ listing, isOwner }) {
  const { data: reviews, loading, error, reload } = useAsync(() => fetchListingReviews(listing.id), `reviews-${listing.id}`)
  if (error) return null // e.g. reviews not set up yet — the rest of the page still works

  const list = reviews ?? []
  const count = list.length
  const average = count ? list.reduce((sum, r) => sum + r.rating, 0) / count : 0
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({ stars, n: list.filter((r) => r.rating === stars).length }))

  return (
    <Reveal className="mt-12 border-t border-black/5 pt-10">
      <section id="reviews" className="scroll-mt-28">
        <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
          <Star className="h-6 w-6 fill-amber-400 text-amber-400" />
          {count ? (
            <>
              {average.toFixed(1)} <span className="text-stone-400">·</span> {count} {count === 1 ? 'review' : 'reviews'}
            </>
          ) : (
            'Reviews'
          )}
        </h2>

        {loading && !reviews && <div className="shimmer mt-6 h-32 rounded-2xl" />}

        {!loading && count === 0 && (
          <p className="mt-3 text-stone-500">
            No reviews yet. Guests can review this place after their stay — only real stays count.
          </p>
        )}

        {count > 0 && (
          <div className="mt-6 grid gap-8 md:grid-cols-[13rem_1fr]">
            <div className="space-y-2">
              {breakdown.map(({ stars, n }) => (
                <div key={stars} className="flex items-center gap-3 text-sm text-stone-600">
                  <span className="w-3">{stars}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-stone-200">
                    <motion.span
                      className="block h-full rounded-full bg-stone-900"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(n / count) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease }}
                    />
                  </span>
                  <span className="w-4 text-right text-stone-400">{n}</span>
                </div>
              ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {list.map((review) => (
                <ReviewItem key={review.id} review={review} canReply={isOwner} onReplied={reload} />
              ))}
            </div>
          </div>
        )}
      </section>
    </Reveal>
  )
}
