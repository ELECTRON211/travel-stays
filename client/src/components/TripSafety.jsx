import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { LifeBuoy, MessageCircle, PhoneCall, Share2, Siren } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { formatLongDate } from '../lib/dates'
import { ease } from '../lib/motion'

// Emergency help and "Share my trip" on an upcoming booking, so family always
// knows where the traveller is staying.
export default function TripSafety({ booking }) {
  const toast = useToast()
  const listing = booking.listing ?? {}
  const reference = booking.id.slice(0, 8).toUpperCase()
  const place = [listing.address, listing.city].filter(Boolean).join(', ')

  const tripText = [
    'My trip on Travel & Stays',
    `Staying at: ${listing.title ?? 'my booked stay'}`,
    place && `Where: ${place}`,
    `When: ${formatLongDate(booking.check_in)} to ${formatLongDate(booking.check_out)}`,
    `Booking reference: ${reference}`,
    listing.id && `${window.location.origin}/listings/${listing.id}`,
    'In an emergency in Nigeria, call 112 (police, fire, ambulance).',
  ]
    .filter(Boolean)
    .join('\n')

  async function shareTrip() {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My trip', text: tripText })
        return
      }
      await navigator.clipboard.writeText(tripText)
      toast.show({ title: 'Trip details copied', description: 'Paste them into a message to family or a friend.' })
    } catch (err) {
      if (err?.name !== 'AbortError') {
        toast.show({ type: 'error', title: 'Could not share', description: 'Try the WhatsApp button instead.' })
      }
    }
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.6, ease }}
      className="mt-6 grid gap-4 md:grid-cols-2"
    >
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5 sm:p-7">
        <h2 className="flex items-center gap-2 font-display text-2xl text-stone-900">
          <Share2 className="h-5 w-5 text-emerald-700" /> Share my trip
        </h2>
        <p className="mt-1 text-sm text-stone-500">
          Send where you’re staying and your dates to family or a friend, so someone always knows where you are.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={shareTrip}
            className="flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-900"
          >
            <Share2 className="h-4 w-4" /> Share trip details
          </button>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(tripText)}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-stone-800 ring-1 ring-stone-300 transition hover:ring-stone-900"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>

      <div className="order-first rounded-3xl bg-red-50 p-6 ring-1 ring-red-200 sm:p-7 md:order-last">
        <h2 className="flex items-center gap-2 font-display text-2xl text-red-900">
          <Siren className="h-5 w-5 text-red-600" /> In an emergency
        </h2>
        <p className="mt-1 text-sm text-red-900/80">
          Get somewhere safe, then call for help. 112 is Nigeria’s free emergency number for police, fire and ambulance.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="tel:112"
            className="flex items-center gap-2 rounded-full bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            <PhoneCall className="h-4 w-4" /> Call 112
          </a>
          <Link
            to="/help#contact"
            className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-red-800 ring-1 ring-red-200 transition hover:ring-red-400"
          >
            <LifeBuoy className="h-4 w-4" /> Contact support
          </Link>
        </div>
      </div>
    </motion.section>
  )
}
