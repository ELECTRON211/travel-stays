import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck, ChevronDown, Loader2, Minus, Plus, ShieldCheck, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { createBooking, fetchBookedRanges, quote } from '../lib/bookings'
import { formatShortDate } from '../lib/dates'
import { formatNaira } from '../lib/format'
import { ease } from '../lib/motion'
import DateRangePicker from './DateRangePicker'
import { Rating } from './ListingCard'
import { Alert } from './AuthShell'

const fieldLabel = 'block text-[10px] font-bold uppercase tracking-[0.15em] text-stone-500'

function PriceRow({ label, value, strong = false }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'text-base font-semibold text-stone-900' : 'text-stone-600'}`}>
      <span>{label}</span>
      <span className="tabular-nums">{value}</span>
    </div>
  )
}

// The booking box on a listing page: dates, guests, live price breakdown and
// the Book button. The server re-checks availability and recalculates the
// price, so this is a preview — what the database accepts is final.
export default function BookingWidget({ listing, initial = {} }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: blocked, reload } = useAsync(() => fetchBookedRanges(listing.id), listing.id)

  const maxGuests = Math.max(listing.max_guests || 1, 1)
  const [dates, setDates] = useState({ checkIn: initial.checkin ?? '', checkOut: initial.checkout ?? '' })
  const [guests, setGuests] = useState(() => Math.min(Math.max(Number(initial.guests) || 1, 1), maxGuests))
  const [open, setOpen] = useState(null) // 'dates' | 'guests' | null
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const price = quote(listing, dates.checkIn, dates.checkOut)
  const instant = listing.booking_mode === 'instant'
  const isOwner = user?.id === listing.host_id

  async function handleBook() {
    setError('')
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    if (!dates.checkIn || !dates.checkOut) {
      setError('Pick your check-in and check-out dates first.')
      setOpen('dates')
      return
    }

    setSubmitting(true)
    try {
      const booking = await createBooking({
        listingId: listing.id,
        checkIn: dates.checkIn,
        checkOut: dates.checkOut,
        guests,
      })
      navigate(`/trips/${booking.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
      reload() // someone may have just taken these dates — refresh the calendar
    }
  }

  return (
    <div className="relative rounded-3xl bg-white p-6 shadow-2xl shadow-emerald-950/10 ring-1 ring-stone-900/5 sm:p-7">
      <div className="flex items-end justify-between gap-3">
        <p className="text-stone-500">
          <span className="font-display text-4xl font-medium text-stone-900">{formatNaira(listing.price_per_night)}</span>{' '}
          night
        </p>
        <Rating listing={listing} />
      </div>

      {isOwner ? (
        <div className="mt-6 rounded-2xl bg-stone-50 p-5 text-sm text-stone-600 ring-1 ring-stone-900/5">
          This is your listing, so you can't book it. Guests will see dates, a price breakdown and a{' '}
          <strong>{instant ? 'Instant Book' : 'Request to book'}</strong> button here.
          <Link to="/host/listings" className="mt-3 block font-semibold text-emerald-800 underline underline-offset-4">
            Manage my listings
          </Link>
        </div>
      ) : (
        <>
          {/* Dates and guests */}
          <div className="relative mt-6">
            <div className="overflow-hidden rounded-2xl ring-1 ring-stone-300">
              <div className="grid grid-cols-2 divide-x divide-stone-300">
                {[
                  { key: 'checkIn', label: 'Check in' },
                  { key: 'checkOut', label: 'Check out' },
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setOpen(open === 'dates' ? null : 'dates')}
                    className={`px-4 py-3 text-left transition-colors hover:bg-stone-50 ${open === 'dates' ? 'bg-stone-50' : ''}`}
                  >
                    <span className={fieldLabel}>{label}</span>
                    <span className={`mt-0.5 block text-sm font-medium ${dates[key] ? 'text-stone-900' : 'text-stone-400'}`}>
                      {dates[key] ? formatShortDate(dates[key]) : 'Add date'}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setOpen(open === 'guests' ? null : 'guests')}
                className={`flex w-full items-center justify-between border-t border-stone-300 px-4 py-3 text-left transition-colors hover:bg-stone-50 ${
                  open === 'guests' ? 'bg-stone-50' : ''
                }`}
              >
                <span>
                  <span className={fieldLabel}>Guests</span>
                  <span className="mt-0.5 block text-sm font-medium text-stone-900">
                    {guests} {guests === 1 ? 'guest' : 'guests'}
                  </span>
                </span>
                <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${open === 'guests' ? 'rotate-180' : ''}`} />
              </button>
            </div>

            <AnimatePresence>
              {open && (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setOpen(null)} />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    transition={{ duration: 0.2, ease }}
                    className={`absolute right-0 top-full z-30 mt-2 rounded-2xl bg-white p-5 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-900/5 ${
                      open === 'dates' ? 'w-full lg:w-[40rem]' : 'w-full'
                    }`}
                  >
                    {open === 'dates' ? (
                      <DateRangePicker
                        checkIn={dates.checkIn}
                        checkOut={dates.checkOut}
                        blockedRanges={blocked ?? []}
                        onChange={(next) => {
                          setDates(next)
                          setError('')
                          if (next.checkOut) setOpen(null)
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-stone-900">Guests</p>
                          <p className="text-sm text-stone-500">This place fits up to {maxGuests}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setGuests(guests - 1)}
                            disabled={guests <= 1}
                            className="grid h-9 w-9 place-items-center rounded-full text-stone-600 ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-30"
                            aria-label="Fewer guests"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <motion.span
                            key={guests}
                            initial={{ y: -6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="w-6 text-center font-semibold tabular-nums"
                          >
                            {guests}
                          </motion.span>
                          <button
                            type="button"
                            onClick={() => setGuests(guests + 1)}
                            disabled={guests >= maxGuests}
                            className="grid h-9 w-9 place-items-center rounded-full text-stone-600 ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-30"
                            aria-label="More guests"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="mt-4">
              <Alert>{error}</Alert>
            </div>
          )}

          <motion.button
            type="button"
            whileHover={{ scale: submitting ? 1 : 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleBook}
            disabled={submitting}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-4 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-900 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : instant ? (
              <Zap className="h-5 w-5" fill="currentColor" />
            ) : (
              <CalendarCheck className="h-5 w-5" />
            )}
            {submitting ? 'Booking…' : !user ? 'Log in to book' : instant ? 'Instant Book' : 'Request to book'}
          </motion.button>
          <p className="mt-3 text-center text-xs text-stone-500">
            {!user
              ? "You'll need a free account to book."
              : instant
                ? "You'll be confirmed straight away. No payment is taken yet."
                : 'The host reviews your request first. No payment is taken yet.'}
          </p>

          {/* Price breakdown */}
          <AnimatePresence initial={false}>
            {price && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.35, ease }}
                className="overflow-hidden"
              >
                <div className="mt-6 space-y-3 border-t border-stone-100 pt-6 text-sm">
                  <PriceRow
                    label={`${formatNaira(price.rate)} × ${price.nights} ${price.nights === 1 ? 'night' : 'nights'}`}
                    value={formatNaira(price.subtotal)}
                  />
                  {price.cleaningFee > 0 && <PriceRow label="Cleaning fee" value={formatNaira(price.cleaningFee)} />}
                  <PriceRow label="Service fee" value={formatNaira(price.serviceFee)} />
                  <div className="border-t border-stone-100 pt-3">
                    <PriceRow label="Total" value={formatNaira(price.total)} strong />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      <div className="mt-6 flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-700" />
        Your dates are protected: once booked, nobody else can take them.
      </div>
    </div>
  )
}
