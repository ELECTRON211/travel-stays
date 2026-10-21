import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ArrowLeft, Ban, CalendarDays, ChevronLeft, ChevronRight, Loader2, Lock, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { fetchListing } from '../lib/listings'
import { blockDates, fetchListingCalendar, unblockDates } from '../lib/calendar'
import { addDays, formatShortDate, toISODate, todayISO } from '../lib/dates'
import { initials } from '../lib/format'
import { ease } from '../lib/motion'
import { Alert } from '../components/AuthShell'

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const KIND_STYLES = {
  confirmed: 'bg-emerald-800 text-white',
  pending: 'bg-amber-200 text-amber-900',
  blocked: 'bg-stone-300 text-stone-600 [background-image:repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(255,255,255,.35)_5px,rgba(255,255,255,.35)_10px)]',
}

// Maps every booked or blocked night ("YYYY-MM-DD") to what occupies it.
function buildNightMap(calendar) {
  const nights = new Map()
  for (const booking of calendar?.bookings ?? []) {
    for (let d = booking.check_in; d < booking.check_out; d = addDays(d, 1)) {
      nights.set(d, { kind: booking.status === 'pending' ? 'pending' : 'confirmed', booking })
    }
  }
  for (const block of calendar?.blocks ?? []) {
    for (let d = block.start_date; d < block.end_date; d = addDays(d, 1)) nights.set(d, { kind: 'blocked', block })
  }
  return nights
}

function nightsLabel(start, endExclusive) {
  const n = Math.round((new Date(endExclusive) - new Date(start)) / 86_400_000)
  return `${n} ${n === 1 ? 'night' : 'nights'}`
}

export default function HostCalendar() {
  const { id } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const { data: listing, loading: listingLoading } = useAsync(() => fetchListing(id), id)
  const { data: calendar, error, reload } = useAsync(() => fetchListingCalendar(id), `calendar-${id}`)

  const now = new Date()
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() })
  const [selection, setSelection] = useState({ start: '', end: '' }) // nights, both inclusive
  const [active, setActive] = useState(null) // a clicked booking or block
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  if (listingLoading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (!listing || listing.host_id !== user.id) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <Lock className="h-8 w-8 text-stone-400" />
        <h1 className="mt-4 font-display text-2xl text-stone-900">You can only manage your own listings</h1>
        <Link to="/host/listings" className="mt-8 rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white">
          Back to my listings
        </Link>
      </div>
    )
  }

  const today = todayISO()
  const nights = buildNightMap(calendar)
  const first = new Date(view.year, view.month, 1)
  const offset = (first.getDay() + 6) % 7
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate()
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => toISODate(new Date(view.year, view.month, i + 1))),
  ]
  const atCurrentMonth = view.year === now.getFullYear() && view.month === now.getMonth()

  function shiftMonth(delta) {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  function clearSelection() {
    setSelection({ start: '', end: '' })
    setNote('')
  }

  function handleDayClick(iso) {
    if (iso < today) return
    const taken = nights.get(iso)
    if (taken) {
      clearSelection()
      setActive(taken)
      return
    }
    setActive(null)

    if (!selection.start || selection.end || iso < selection.start) {
      setSelection({ start: iso, end: '' })
      return
    }
    // Don't allow a block that runs across a booked or blocked night.
    for (let d = selection.start; d <= iso; d = addDays(d, 1)) {
      if (nights.has(d)) {
        toast.show({ type: 'error', title: 'That range overlaps a booking', description: 'Pick nights that are all free.' })
        setSelection({ start: iso, end: '' })
        return
      }
    }
    setSelection({ start: selection.start, end: iso })
  }

  function inSelection(iso) {
    const end = selection.end || selection.start
    return selection.start && iso >= selection.start && iso <= end
  }

  async function saveBlock() {
    const lastNight = selection.end || selection.start
    setSaving(true)
    try {
      await blockDates(listing.id, selection.start, addDays(lastNight, 1), note.trim())
      toast.show({
        title: 'Dates blocked',
        description: `${formatShortDate(selection.start)} – ${formatShortDate(lastNight)} are no longer bookable.`,
      })
      clearSelection()
      reload()
    } catch (err) {
      toast.show({ type: 'error', title: "Couldn't block those dates", description: err.message })
    } finally {
      setSaving(false)
    }
  }

  async function removeBlock(block) {
    setSaving(true)
    try {
      await unblockDates(block.id)
      toast.show({ title: 'Dates unblocked', description: 'Guests can book them again.' })
      setActive(null)
      reload()
    } catch (err) {
      toast.show({ type: 'error', title: "Couldn't unblock those dates", description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const upcoming = [
    ...(calendar?.bookings ?? []).filter((b) => b.check_out > today).map((b) => ({ type: 'booking', start: b.check_in, item: b })),
    ...(calendar?.blocks ?? []).filter((k) => k.end_date > today).map((k) => ({ type: 'block', start: k.start_date, item: k })),
  ].sort((a, b) => (a.start < b.start ? -1 : 1))

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <Link
        to="/host/listings"
        className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> My listings
      </Link>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">Calendar</p>
      <h1 className="mt-2 font-display text-4xl font-medium tracking-tight text-stone-900 sm:text-5xl">{listing.title}</h1>
      <p className="mt-2 text-stone-500">See who's staying, and block nights when your place isn't available.</p>

      {error && (
        <div className="mt-6">
          <Alert>Could not load the calendar: {error}</Alert>
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Month grid */}
        <div className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-stone-900/5 sm:p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              disabled={atCurrentMonth}
              className="grid h-9 w-9 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 disabled:opacity-30"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="font-display text-2xl text-stone-900">
              {first.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
            </h2>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="grid h-9 w-9 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
              aria-label="Next month"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-6 grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wider text-stone-400">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={`${view.year}-${view.month}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease }}
              className="mt-2 grid grid-cols-7 gap-1.5"
            >
              {cells.map((iso, i) => {
                if (!iso) return <span key={`blank-${i}`} />
                const taken = nights.get(iso)
                const past = iso < today
                const selected = inSelection(iso)
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => handleDayClick(iso)}
                    disabled={past}
                    className={`relative flex aspect-square flex-col items-start justify-between rounded-xl p-1.5 text-left text-sm transition sm:p-2 ${
                      past
                        ? 'cursor-default text-stone-300'
                        : taken
                          ? `${KIND_STYLES[taken.kind]} hover:opacity-90`
                          : selected
                            ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-700'
                            : 'bg-stone-50 text-stone-800 hover:bg-stone-100'
                    } ${iso === today ? 'ring-2 ring-stone-900' : ''}`}
                  >
                    <span className="font-semibold">{Number(iso.slice(8))}</span>
                    {taken?.booking && (taken.booking.check_in === iso || iso.endsWith('-01') || i % 7 === 0) && (
                      <span className="max-w-full truncate rounded-md bg-white/25 px-1 text-[10px] font-bold sm:text-xs">
                        {initials(taken.booking.guest_name)}
                      </span>
                    )}
                    {taken?.kind === 'blocked' && <Ban className="h-3.5 w-3.5" />}
                  </button>
                )
              })}
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex flex-wrap gap-4 text-xs text-stone-600">
            {[
              ['bg-emerald-800', 'Confirmed'],
              ['bg-amber-200', 'Request pending'],
              ['bg-stone-300', 'Blocked by you'],
              ['bg-stone-50 ring-1 ring-stone-200', 'Available'],
            ].map(([swatch, label]) => (
              <span key={label} className="flex items-center gap-2">
                <span className={`h-3.5 w-3.5 rounded ${swatch}`} /> {label}
              </span>
            ))}
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {selection.start ? (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-emerald-800/20"
              >
                <h3 className="flex items-center gap-2 font-display text-xl text-stone-900">
                  <Ban className="h-5 w-5 text-emerald-800" /> Block dates
                </h3>
                <p className="mt-2 text-sm text-stone-600">
                  {formatShortDate(selection.start)}
                  {selection.end && selection.end !== selection.start && ` – ${formatShortDate(selection.end)}`} ·{' '}
                  {nightsLabel(selection.start, addDays(selection.end || selection.start, 1))}
                </p>
                {!selection.end && (
                  <p className="mt-1 text-xs text-stone-400">Tap another day to block a longer range.</p>
                )}
                <input
                  className="mt-4 w-full rounded-xl px-3 py-2.5 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700"
                  placeholder="Note for yourself (optional), e.g. Family visiting"
                  maxLength={100}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="flex-1 rounded-full py-2.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={saveBlock}
                    disabled={saving}
                    className="flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-800 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                  >
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Block
                  </button>
                </div>
              </motion.div>
            ) : active?.block ? (
              <motion.div
                key="block"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-900/10"
              >
                <h3 className="font-display text-xl text-stone-900">Blocked</h3>
                <p className="mt-2 text-sm text-stone-600">
                  {formatShortDate(active.block.start_date)} – {formatShortDate(addDays(active.block.end_date, -1))} ·{' '}
                  {nightsLabel(active.block.start_date, active.block.end_date)}
                </p>
                {active.block.note && <p className="mt-2 rounded-xl bg-stone-50 p-3 text-sm text-stone-600">{active.block.note}</p>}
                <button
                  type="button"
                  onClick={() => removeBlock(active.block)}
                  disabled={saving}
                  className="mt-4 w-full rounded-full py-2.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
                >
                  Unblock these dates
                </button>
              </motion.div>
            ) : active?.booking ? (
              <motion.div
                key="booking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-900/10"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">
                  {active.booking.status === 'pending' ? 'Request pending' : 'Confirmed stay'}
                </p>
                <h3 className="mt-1 font-display text-xl text-stone-900">{active.booking.guest_name}</h3>
                <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                  <CalendarDays className="h-4 w-4" /> {formatShortDate(active.booking.check_in)} –{' '}
                  {formatShortDate(active.booking.check_out)}
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-stone-600">
                  <Users className="h-4 w-4" /> {active.booking.guests} {active.booking.guests === 1 ? 'guest' : 'guests'}
                  {' · '}
                  {active.booking.payment_status === 'paid' ? 'Paid' : 'Not paid yet'}
                </p>
                {active.booking.status === 'pending' && (
                  <Link to="/host/listings" className="mt-4 block text-sm font-semibold text-emerald-800 underline">
                    Answer this request on your dashboard
                  </Link>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="help"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="rounded-3xl bg-emerald-900 p-6 text-emerald-50"
              >
                <h3 className="font-display text-xl text-white">How it works</h3>
                <ul className="mt-3 space-y-2 text-sm text-emerald-50/80">
                  <li>Tap a free day to block it. Tap a second day to block a range.</li>
                  <li>Blocked nights are greyed out for guests and can't be booked.</li>
                  <li>Tap a booking or a blocked day to see details.</li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
            <h3 className="font-display text-xl text-stone-900">Coming up</h3>
            {upcoming.length === 0 ? (
              <p className="mt-2 text-sm text-stone-500">No bookings or blocked dates yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-stone-100">
                {upcoming.slice(0, 6).map(({ type, item }) => (
                  <li key={item.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-stone-900">
                        {type === 'booking' ? item.guest_name : item.note || 'Blocked'}
                      </span>
                      <span className="text-stone-500">
                        {type === 'booking'
                          ? `${formatShortDate(item.check_in)} – ${formatShortDate(item.check_out)}`
                          : `${formatShortDate(item.start_date)} – ${formatShortDate(addDays(item.end_date, -1))}`}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        type === 'block'
                          ? 'bg-stone-100 text-stone-600'
                          : item.status === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {type === 'block' ? 'Blocked' : item.status === 'pending' ? 'Pending' : 'Confirmed'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
