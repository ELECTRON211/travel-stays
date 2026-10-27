import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, Check, Compass, Eye, Inbox, Pause, Pencil, Play, Plus, Trash2, Users, Wallet, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { formatLongDate, formatTime, todayISO } from '../lib/dates'
import { formatNaira } from '../lib/format'
import { fadeUp, stagger } from '../lib/motion'
import {
  categoryLabel,
  deleteTour,
  fetchGuideTourBookings,
  fetchGuideTours,
  formatDays,
  respondToTourBooking,
  updateTourStatus,
} from '../lib/tours'
import { ListingCover } from '../components/ListingCard'
import { Alert } from '../components/AuthShell'
import TypeWriter from '../components/TypeWriter'
import ReportButton from '../components/ReportButton'

function Stat({ icon: Icon, label, value }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
      <Icon className="h-5 w-5 text-emerald-800" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 font-display text-3xl text-stone-900">{value}</p>
    </motion.div>
  )
}

function BookingRow({ booking, onRespond, busy }) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-900/5 sm:flex-row sm:items-center">
      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
        <ListingCover listing={booking.tour ?? { id: booking.tour_id, title: 'Tour' }} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-stone-900">{booking.tour?.title ?? 'Tour'}</p>
        <p className="mt-0.5 flex flex-wrap gap-x-4 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" /> {formatLongDate(booking.tour_date)}
            {booking.tour?.start_time && `, ${formatTime(booking.tour.start_time)}`}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {booking.people} {booking.people === 1 ? 'person' : 'people'}
          </span>
          <span className="font-medium text-stone-700">{formatNaira(booking.people * booking.price_per_person)}</span>
        </p>
        <ReportButton targetType="guest" targetId={booking.traveler_id} label="Report guest" className="mt-1 text-xs" />
      </div>
      {onRespond ? (
        <div className="flex gap-2">
          <button
            disabled={busy}
            onClick={() => onRespond(booking, false)}
            className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900 disabled:opacity-50"
          >
            <X className="h-4 w-4" /> Decline
          </button>
          <button
            disabled={busy}
            onClick={() => onRespond(booking, true)}
            className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
          >
            <Check className="h-4 w-4" /> Accept
          </button>
        </div>
      ) : (
        <span className="w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">Confirmed</span>
      )}
    </div>
  )
}

export default function MyTours() {
  const { user } = useAuth()
  const toast = useToast()
  const tours = useAsync(() => fetchGuideTours(user.id), user.id)
  const bookings = useAsync(() => fetchGuideTourBookings(user.id), user.id)
  const [busy, setBusy] = useState(null)

  const today = todayISO()
  const all = bookings.data ?? []
  const requests = all.filter((b) => b.status === 'pending' && b.tour_date >= today)
  const upcoming = all.filter((b) => b.status === 'confirmed' && b.tour_date >= today)
  const earnings = all.filter((b) => b.status === 'confirmed').reduce((sum, b) => sum + b.people * b.price_per_person, 0)
  const list = tours.data ?? []

  async function run(id, action, success) {
    setBusy(id)
    try {
      await action()
      toast.show(success)
      tours.reload()
      bookings.reload()
    } catch (err) {
      toast.show({ type: 'error', title: 'Something went wrong', description: err.message })
    }
    setBusy(null)
  }

  const respond = (booking, accept) =>
    run(booking.id, () => respondToTourBooking(booking.id, accept), {
      title: accept ? 'Booking confirmed' : 'Request declined',
      description: accept ? 'The traveller can see it in their trips.' : 'Those places are free again.',
    })

  const toggle = (tour) =>
    run(tour.id, () => updateTourStatus(tour.id, tour.status === 'active' ? 'paused' : 'active'), {
      title: tour.status === 'active' ? 'Tour paused' : 'Tour is live again',
      description: tour.status === 'active' ? 'It is hidden from search.' : 'Travellers can book it.',
    })

  const remove = (tour) => {
    if (!window.confirm(`Delete "${tour.title}"? Its bookings will be removed too.`)) return
    run(tour.id, () => deleteTour(tour), { title: 'Tour deleted', description: tour.title })
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
            Guide dashboard
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 font-display text-5xl font-medium tracking-tight text-stone-900">
            My <em className="text-emerald-800"><TypeWriter text="tours." /></em>
          </motion.h1>
        </motion.div>
        <Link
          to="/guide/tours/new"
          className="flex items-center gap-2 rounded-full bg-emerald-800 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
        >
          <Plus className="h-4 w-4" /> Create a tour
        </Link>
      </div>

      {(tours.error || bookings.error) && (
        <div className="mt-8">
          <Alert>Could not load your tours: {tours.error || bookings.error}</Alert>
        </div>
      )}

      <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={Compass} label="Live tours" value={list.filter((t) => t.status === 'active').length} />
        <Stat icon={Inbox} label="New requests" value={requests.length} />
        <Stat icon={Users} label="Guests coming" value={upcoming.reduce((n, b) => n + b.people, 0)} />
        <Stat icon={Wallet} label="Confirmed earnings" value={formatNaira(earnings)} />
      </motion.div>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-stone-900">Booking requests</h2>
        <div className="mt-4 space-y-3">
          {requests.length ? (
            requests.map((b) => <BookingRow key={b.id} booking={b} onRespond={respond} busy={busy === b.id} />)
          ) : (
            <p className="rounded-2xl border-2 border-dashed border-stone-200 px-6 py-8 text-center text-sm text-stone-500">
              No new requests. They'll show up here when travellers book.
            </p>
          )}
        </div>
      </section>

      {upcoming.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-stone-900">Upcoming departures</h2>
          <div className="mt-4 space-y-3">
            {upcoming.map((b) => (
              <BookingRow key={b.id} booking={b} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="font-display text-2xl text-stone-900">Your tours</h2>
        {tours.loading && !tours.data ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="shimmer h-72 rounded-2xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <div className="mt-4 rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 px-6 py-14 text-center">
            <Compass className="mx-auto h-10 w-10 text-emerald-800" strokeWidth={1.5} />
            <p className="mt-4 font-display text-2xl text-stone-900">No tours yet</p>
            <p className="mt-1 text-stone-500">Create your first tour and start welcoming travellers.</p>
            <Link to="/guide/tours/new" className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white">
              <Plus className="h-4 w-4" /> Create a tour
            </Link>
          </div>
        ) : (
          <motion.div variants={stagger(0.06)} initial="hidden" animate="show" className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((tour) => (
              <motion.div key={tour.id} variants={fadeUp} className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
                <div className="relative aspect-video">
                  <ListingCover listing={tour} />
                  <span
                    className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold ${
                      tour.status === 'active' ? 'bg-emerald-600 text-white' : 'bg-stone-800 text-white'
                    }`}
                  >
                    {tour.status === 'active' ? 'Live' : 'Paused'}
                  </span>
                </div>
                <div className="p-4">
                  <p className="truncate font-semibold text-stone-900">{tour.title}</p>
                  <p className="mt-0.5 text-sm text-stone-500">
                    {categoryLabel(tour.category)} · {tour.city} · {formatDays(tour.days)}
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">{formatNaira(tour.price_per_person)} per person</p>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm">
                    <Link to={`/tours/${tour.id}`} className="flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Link>
                    <Link to={`/guide/tours/${tour.id}/edit`} className="flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900">
                      <Pencil className="h-3.5 w-3.5" /> Edit
                    </Link>
                    <button
                      disabled={busy === tour.id}
                      onClick={() => toggle(tour)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 ring-1 ring-stone-300 hover:ring-stone-900 disabled:opacity-50"
                    >
                      {tour.status === 'active' ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      {tour.status === 'active' ? 'Pause' : 'Resume'}
                    </button>
                    <button
                      disabled={busy === tour.id}
                      onClick={() => remove(tour)}
                      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-red-700 ring-1 ring-red-200 hover:ring-red-500 disabled:opacity-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>
    </div>
  )
}
