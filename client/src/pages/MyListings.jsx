import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import {
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  CircleCheck,
  Eye,
  ImagePlus,
  LayoutGrid,
  List,
  MoreHorizontal,
  Pause,
  Pencil,
  Play,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Wallet,
  X,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { deleteListing, fetchHostListings, updateListingStatus } from '../lib/listings'
import { fetchHostBookings, hostPayout, respondToBooking } from '../lib/bookings'
import { formatShortDate, todayISO } from '../lib/dates'
import { formatNaira, initials } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { ease, fadeUp, stagger } from '../lib/motion'
import { ListingCover, TrustBadges } from '../components/ListingCard'
import { Alert } from '../components/AuthShell'

const VIEW_KEY = 'host-listings-view'

function readSavedView() {
  try {
    return localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid'
  } catch {
    return 'grid'
  }
}

function StatCard({ icon: Icon, label, value, hint }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</p>
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-800">
          <Icon className="h-4.5 w-4.5" />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-medium tracking-tight text-stone-900">{value}</p>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </motion.div>
  )
}

function StatusSwitch({ active, disabled, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      aria-label={active ? 'Pause listing' : 'Activate listing'}
      disabled={disabled}
      onClick={onToggle}
      className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 disabled:opacity-50 ${
        active ? 'justify-end bg-emerald-800' : 'justify-start bg-stone-300'
      }`}
    >
      <motion.span layout transition={{ type: 'spring', stiffness: 600, damping: 32 }} className="h-5 w-5 rounded-full bg-white shadow" />
    </button>
  )
}

function ReviewSummary({ listing }) {
  if (!listing.review_count) return <span className="text-stone-500">No reviews yet</span>
  return (
    <span className="flex items-center gap-1 font-semibold text-stone-900">
      <Star className="h-3.5 w-3.5 fill-current" /> {Number(listing.rating).toFixed(1)}
      <span className="font-normal text-stone-500">({listing.review_count})</span>
    </span>
  )
}

// "⋯" menu with the actions for one listing. Edit and calendar arrive with
// the booking work, so they are shown but marked as coming soon.
function ActionMenu({ listing, busy, onToggle, onDelete }) {
  const [open, setOpen] = useState(false)
  const paused = listing.status !== 'active'

  const itemClass = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors'

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={busy}
        className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition hover:bg-stone-100 hover:text-stone-900 disabled:opacity-50"
        aria-label="Listing actions"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15, ease }}
              className="absolute right-0 z-20 mt-2 w-56 origin-top-right overflow-hidden rounded-xl bg-white py-1.5 shadow-2xl shadow-stone-900/15 ring-1 ring-stone-900/5"
            >
              <Link to={`/listings/${listing.id}`} className={`${itemClass} text-stone-700 hover:bg-stone-50`}>
                <Eye className="h-4 w-4" /> View listing
              </Link>
              <Link to={`/host/listings/${listing.id}/edit`} className={`${itemClass} text-stone-700 hover:bg-stone-50`}>
                <Pencil className="h-4 w-4" /> Edit listing
              </Link>
              <Link
                to={`/host/listings/${listing.id}/calendar`}
                className={`${itemClass} text-stone-700 hover:bg-stone-50`}
              >
                <CalendarDays className="h-4 w-4" /> View calendar
              </Link>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onToggle()
                }}
                className={`${itemClass} text-stone-700 hover:bg-stone-50`}
              >
                {paused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                {paused ? 'Activate' : 'Pause'}
              </button>
              <div className="my-1.5 border-t border-stone-100" />
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onDelete()
                }}
                className={`${itemClass} text-red-600 hover:bg-red-50`}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

function GridCard({ listing, busy, onToggle, onDelete }) {
  const active = listing.status === 'active'
  return (
    <div className="group rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5 transition-shadow duration-300 hover:shadow-xl hover:shadow-stone-900/10">
      <Link to={`/listings/${listing.id}`} className="relative block aspect-4/3 overflow-hidden rounded-t-2xl">
        <ListingCover listing={listing} className="transition-transform duration-700 ease-out group-hover:scale-105" />
        <TrustBadges listing={listing} className="absolute left-3 right-3 top-3" />
        <AnimatePresence>
          {!active && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 grid place-items-center bg-stone-900/45 backdrop-blur-[2px]"
            >
              <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-stone-900">
                <Pause className="h-3.5 w-3.5" /> Paused · hidden from search
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </Link>

      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-semibold tracking-tight text-stone-900">{listing.title}</h3>
            <p className="mt-0.5 text-sm text-stone-500">
              {propertyLabel(listing.property_type)} · {listing.city}
            </p>
          </div>
          <ActionMenu listing={listing} busy={busy} onToggle={onToggle} onDelete={onDelete} />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-stone-50 p-3 text-sm">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Nightly rate</p>
            <p className="mt-0.5 font-semibold text-stone-900">{formatNaira(listing.price_per_night)}</p>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Reviews</p>
            <p className="mt-0.5">
              <ReviewSummary listing={listing} />
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <span className={`text-sm font-medium ${active ? 'text-emerald-800' : 'text-stone-500'}`}>
            {active ? 'Active · visible in search' : 'Paused'}
          </span>
          <StatusSwitch active={active} disabled={busy} onToggle={onToggle} />
        </div>
      </div>
    </div>
  )
}

function ListRow({ listing, busy, onToggle, onDelete }) {
  const active = listing.status === 'active'
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-900/5 transition-shadow hover:shadow-lg sm:flex-row sm:items-center">
      <Link
        to={`/listings/${listing.id}`}
        className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl sm:aspect-auto sm:h-20 sm:w-28"
      >
        <ListingCover listing={listing} />
        {!active && <span className="absolute inset-0 bg-stone-900/40" />}
      </Link>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold tracking-tight text-stone-900">{listing.title}</h3>
        <p className="mt-0.5 text-sm text-stone-500">
          {propertyLabel(listing.property_type)} · {listing.city} · up to {listing.max_guests} guests
        </p>
      </div>

      <div className="grid grid-cols-3 items-center gap-6 text-sm sm:flex">
        <div className="sm:w-28">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Nightly</p>
          <p className="font-semibold text-stone-900">{formatNaira(listing.price_per_night)}</p>
        </div>
        <div className="sm:w-32">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">Reviews</p>
          <ReviewSummary listing={listing} />
        </div>
        <div className="flex items-center gap-2 sm:w-28">
          <StatusSwitch active={active} disabled={busy} onToggle={onToggle} />
          <span className={`font-medium ${active ? 'text-emerald-800' : 'text-stone-500'}`}>
            {active ? 'Active' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="absolute right-4 top-4 sm:static">
        <ActionMenu listing={listing} busy={busy} onToggle={onToggle} onDelete={onDelete} />
      </div>
    </div>
  )
}

function GuestAvatar({ name }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-linear-to-br from-emerald-600 to-teal-600 text-sm font-semibold text-white">
      {initials(name)}
    </span>
  )
}

function stayLabel(booking) {
  return `${formatShortDate(booking.check_in)} – ${formatShortDate(booking.check_out)} · ${booking.guests} ${
    booking.guests === 1 ? 'guest' : 'guests'
  } · ${booking.nights} ${booking.nights === 1 ? 'night' : 'nights'}`
}

// Pending requests the host must answer, and confirmed guests on the way.
function HostBookings({ bookings, respondingId, onRespond }) {
  const today = todayISO()
  const requests = bookings.filter((b) => b.status === 'pending' && b.check_out >= today)
  const upcoming = bookings.filter((b) => b.status === 'confirmed' && b.check_out >= today)
  if (!requests.length && !upcoming.length) return null

  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-2">
      <section>
        <h2 className="flex items-center gap-2 font-display text-2xl tracking-tight text-stone-900">
          Booking requests
          {requests.length > 0 && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-sans text-xs font-bold text-amber-800">
              {requests.length} new
            </span>
          )}
        </h2>
        <div className="mt-4 space-y-3">
          {requests.length === 0 && (
            <p className="rounded-2xl bg-white p-5 text-sm text-stone-500 ring-1 ring-stone-900/5">
              You're all caught up. New requests will appear here.
            </p>
          )}
          <AnimatePresence initial={false}>
            {requests.map((b) => (
              <motion.div
                key={b.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, transition: { duration: 0.25 } }}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-amber-200"
              >
                <div className="flex items-start gap-3">
                  <GuestAvatar name={b.guest_name} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-stone-600">
                      <span className="font-semibold text-stone-900">{b.guest_name}</span> wants to stay at{' '}
                      <Link to={`/listings/${b.listing_id}`} className="font-medium text-stone-900 underline-offset-4 hover:underline">
                        {b.listing?.title ?? 'your listing'}
                      </Link>
                    </p>
                    <p className="mt-1 text-sm text-stone-500">{stayLabel(b)}</p>
                    <p className="mt-1 text-sm">
                      You earn <span className="font-semibold text-stone-900">{formatNaira(hostPayout(b))}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    disabled={respondingId === b.id}
                    onClick={() => onRespond(b, false)}
                    className="flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-50"
                  >
                    <X className="h-4 w-4" /> Decline
                  </button>
                  <button
                    type="button"
                    disabled={respondingId === b.id}
                    onClick={() => onRespond(b, true)}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" /> Accept
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl tracking-tight text-stone-900">Upcoming guests</h2>
        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
          {upcoming.length === 0 ? (
            <p className="p-5 text-sm text-stone-500">No confirmed guests yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {upcoming.slice(0, 6).map((b) => (
                <motion.li
                  key={b.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-3 p-4"
                >
                  <GuestAvatar name={b.guest_name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">
                      {b.guest_name} <span className="font-normal text-stone-500">· {b.listing?.title}</span>
                    </p>
                    <p className="text-sm text-stone-500">{stayLabel(b)}</p>
                  </div>
                  <span className="text-right text-sm">
                    <span className="block font-semibold text-stone-900">{formatNaira(hostPayout(b))}</span>
                    <span
                      className={`text-xs font-semibold ${b.payment_status === 'paid' ? 'text-emerald-700' : 'text-amber-700'}`}
                    >
                      {b.payment_status === 'paid' ? 'Paid' : 'Awaiting payment'}
                    </span>
                  </span>
                </motion.li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease }}
      className="rounded-2xl border-2 border-dashed border-stone-300 bg-white/60 p-12 text-center backdrop-blur-md"
    >
      <div className="relative mx-auto h-28 w-28">
        <motion.span
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-emerald-100/70"
        />
        <span className="absolute inset-4 grid place-items-center rounded-full bg-white shadow-lg shadow-emerald-900/10">
          <Building2 className="h-9 w-9 text-emerald-800" strokeWidth={1.5} />
        </span>
        <motion.span
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -right-1 top-1 grid h-8 w-8 place-items-center rounded-full bg-amber-100 text-amber-700"
        >
          <Sparkles className="h-4 w-4" />
        </motion.span>
      </div>

      <h2 className="mt-8 font-display text-3xl tracking-tight text-stone-900">
        Your first guests are <em className="text-emerald-800">waiting.</em>
      </h2>
      <p className="mx-auto mt-3 max-w-md text-stone-500">
        You haven't listed a place yet. It only takes a few minutes, and you can pause or edit it any time.
      </p>

      <div className="mx-auto mt-8 flex max-w-lg flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-stone-600">
        {[
          { icon: ImagePlus, label: 'Add photos' },
          { icon: Wallet, label: 'Set your price' },
          { icon: CircleCheck, label: 'Go live' },
        ].map(({ icon: Icon, label }, i) => (
          <span key={label} className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">
              {i + 1}
            </span>
            <Icon className="h-4 w-4 text-emerald-800" /> {label}
          </span>
        ))}
      </div>

      <Link
        to="/host/listings/new"
        className="mt-10 inline-flex items-center gap-2 rounded-full bg-emerald-800 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-900/20 transition hover:bg-emerald-900"
      >
        <Plus className="h-4 w-4" /> List your place
      </Link>
    </motion.div>
  )
}

export default function MyListings() {
  const { user } = useAuth()
  const { data: listings, loading, error, reload } = useAsync(() => fetchHostListings(user.id), user.id)
  const [view, setView] = useState(readSavedView)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')
  const {
    data: bookings,
    error: bookingsError,
    reload: reloadBookings,
  } = useAsync(() => fetchHostBookings(user.id), `bookings-${user.id}`)
  const [respondingId, setRespondingId] = useState(null)

  async function respond(booking, accept) {
    setActionError('')
    setRespondingId(booking.id)
    try {
      await respondToBooking(booking.id, accept)
      reloadBookings()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setRespondingId(null)
    }
  }

  function changeView(next) {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {
      // Storage can be unavailable (private mode); the choice just won't persist.
    }
  }

  async function run(listing, action) {
    setActionError('')
    setBusyId(listing.id)
    try {
      await action()
      reload()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setBusyId(null)
    }
  }

  function toggleStatus(listing) {
    const next = listing.status === 'active' ? 'paused' : 'active'
    run(listing, () => updateListingStatus(listing.id, next))
  }

  function remove(listing) {
    if (!window.confirm(`Delete "${listing.title}"? This cannot be undone.`)) return
    run(listing, () => deleteListing(listing))
  }

  const total = listings?.length ?? 0
  const activeCount = listings?.filter((l) => l.status === 'active').length ?? 0
  const firstName = user.fullName.split(' ')[0]

  const confirmed = (bookings ?? []).filter((b) => ['confirmed', 'completed'].includes(b.status))
  const pendingCount = (bookings ?? []).filter((b) => b.status === 'pending' && b.check_out >= todayISO()).length
  const earnings = confirmed.reduce((sum, b) => sum + hostPayout(b), 0)

  const stats = [
    { icon: Building2, label: 'Total listings', value: total },
    { icon: CircleCheck, label: 'Active', value: activeCount, hint: `${total - activeCount} paused` },
    {
      icon: CalendarCheck,
      label: 'Total bookings',
      value: confirmed.length,
      hint: pendingCount ? `${pendingCount} awaiting your reply` : 'Confirmed stays',
    },
    { icon: Wallet, label: 'Est. earnings', value: formatNaira(earnings), hint: 'From confirmed stays' },
  ]

  const cardProps = (listing) => ({
    listing,
    busy: busyId === listing.id,
    onToggle: () => toggleStatus(listing),
    onDelete: () => remove(listing),
  })

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
            Host dashboard
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 font-display text-5xl font-medium tracking-tight text-stone-900">
            My <em className="text-emerald-800">listings.</em>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 text-stone-500">
            {firstName ? `Welcome back, ${firstName}. ` : ''}Manage your places, availability and earnings in one place.
          </motion.p>
        </motion.div>
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            to="/host/listings/new"
            className="flex items-center justify-center gap-2 rounded-full bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-900"
          >
            <Plus className="h-4 w-4" /> New listing
          </Link>
        </motion.div>
      </div>

      {loading && !listings ? (
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="shimmer h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <motion.div
          variants={stagger(0.06, 0.1)}
          initial="hidden"
          animate="show"
          className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4"
        >
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </motion.div>
      )}

      <div className="mt-6 space-y-4">
        {(error || actionError || bookingsError) && <Alert>{error || actionError || bookingsError}</Alert>}
      </div>

      {bookings && <HostBookings bookings={bookings} respondingId={respondingId} onRespond={respond} />}

      {listings?.length === 0 ? (
        <div className="mt-6">
          <EmptyState />
        </div>
      ) : (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="font-display text-2xl tracking-tight text-stone-900">
              Your places {total > 0 && <span className="text-stone-400">({total})</span>}
            </h2>
            <div className="inline-flex rounded-full bg-stone-200/70 p-1" role="tablist" aria-label="Layout">
              {[
                { value: 'grid', icon: LayoutGrid, label: 'Grid view' },
                { value: 'list', icon: List, label: 'List view' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={view === value}
                  aria-label={label}
                  onClick={() => changeView(value)}
                  className={`relative grid h-9 w-10 place-items-center rounded-full transition-colors ${
                    view === value ? 'text-stone-900' : 'text-stone-500 hover:text-stone-900'
                  }`}
                >
                  {view === value && (
                    <motion.span
                      layoutId="host-view"
                      className="absolute inset-0 rounded-full bg-white shadow-sm"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="relative h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {loading && !listings ? (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <div key={i} className="shimmer h-96 rounded-2xl" />
              ))}
            </div>
          ) : (
            <motion.div
              layout
              className={view === 'grid' ? 'mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'mt-6 space-y-3'}
            >
              <AnimatePresence initial={false}>
                {listings?.map((listing, i) => (
                  <motion.div
                    key={listing.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}
                    exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.25 } }}
                    className="relative"
                  >
                    {view === 'grid' ? <GridCard {...cardProps(listing)} /> : <ListRow {...cardProps(listing)} />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
