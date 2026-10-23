import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock,
  Grid2x2,
  Languages,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Route,
  UserRound,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { addDays, formatLongDate, formatTime, todayISO } from '../lib/dates'
import { formatNaira } from '../lib/format'
import { ease, fadeUp, stagger } from '../lib/motion'
import {
  categoryLabel,
  createTourBooking,
  fetchSpotsLeft,
  fetchTour,
  formatDays,
  formatDuration,
  runsOn,
  tourQuote,
} from '../lib/tours'
import { ListingCover } from '../components/ListingCard'
import { CATEGORY_ICONS } from '../components/TourCard'
import { Alert } from '../components/AuthShell'
import Lightbox from '../components/Lightbox'
import Reveal from '../components/Reveal'
import TypeWriter from '../components/TypeWriter'
import NotFound from './NotFound'

function Gallery({ tour, onOpen }) {
  const photos = tour.photos ?? []
  const tiles = photos.slice(0, 3)
  if (photos.length <= 1) {
    return (
      <button onClick={() => photos.length && onOpen(0)} className="block aspect-video w-full overflow-hidden rounded-4xl md:aspect-21/9">
        <ListingCover listing={tour} />
      </button>
    )
  }
  return (
    <div className="relative">
      <motion.div
        variants={stagger(0.08)}
        initial="hidden"
        animate="show"
        className="grid h-80 gap-2 overflow-hidden rounded-4xl md:h-112 md:grid-cols-3 md:grid-rows-2"
      >
        {tiles.map((photo, i) => (
          <motion.button
            key={photo}
            variants={fadeUp}
            onClick={() => onOpen(i)}
            className={`group relative overflow-hidden ${i === 0 ? 'md:col-span-2 md:row-span-2' : 'hidden md:block'}`}
          >
            <ListingCover listing={tour} photo={photo} className="transition-transform duration-700 group-hover:scale-105" />
          </motion.button>
        ))}
      </motion.div>
      <button
        onClick={() => onOpen(0)}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg transition hover:scale-105"
      >
        <Grid2x2 className="h-4 w-4" /> Show all {photos.length} photos
      </button>
    </div>
  )
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl bg-white p-5 ring-1 ring-black/5">
      <Icon className="h-6 w-6 text-emerald-600" strokeWidth={1.5} />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-0.5 font-semibold text-ink">{value}</p>
    </div>
  )
}

function BookingBox({ tour, isOwner }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [date, setDate] = useState('')
  const [people, setPeople] = useState(1)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validDay = date && runsOn(tour, date)
  const spots = useAsync(() => (validDay ? fetchSpotsLeft(tour.id, date) : Promise.resolve(null)), `${tour.id}:${validDay ? date : ''}`)
  const spotsLeft = spots.data
  const price = tourQuote(tour, people)
  const maxPeople = Math.max(1, Math.min(tour.max_group, spotsLeft ?? tour.max_group))

  async function handleBook() {
    setError('')
    if (!user) return navigate('/login', { state: { from: `/tours/${tour.id}` } })
    if (!date) return setError('Pick a date first.')
    if (!validDay) return setError(`This tour runs: ${formatDays(tour.days)}.`)
    setSubmitting(true)
    try {
      await createTourBooking({ tourId: tour.id, date, people })
      toast.show({
        title: 'Request sent!',
        description: `The guide will confirm your place on ${formatLongDate(date)}.`,
        action: { label: 'View', to: '/trips?tab=tours' },
      })
      navigate('/trips?tab=tours')
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl shadow-emerald-950/5 ring-1 ring-black/5">
      <p>
        <span className="font-display text-3xl text-ink">{formatNaira(tour.price_per_person)}</span>{' '}
        <span className="text-stone-500">per person</span>
      </p>

      <label className="mt-6 block">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">Date</span>
        <input
          type="date"
          value={date}
          min={todayISO()}
          max={addDays(todayISO(), 180)}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1.5 w-full rounded-xl px-4 py-3 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700"
        />
      </label>
      <p className="mt-1.5 text-xs text-stone-500">Runs: {formatDays(tour.days)} · starts {formatTime(tour.start_time)}</p>
      {date && !validDay && <p className="mt-1 text-xs font-medium text-amber-700">No tour on that day — pick another date.</p>}
      {validDay && spotsLeft !== null && spotsLeft !== undefined && (
        <p className={`mt-1 text-xs font-medium ${spotsLeft ? 'text-emerald-700' : 'text-red-600'}`}>
          {spotsLeft ? `${spotsLeft} ${spotsLeft === 1 ? 'place' : 'places'} left on this date` : 'Fully booked on this date'}
        </p>
      )}

      <div className="mt-5 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-stone-500">People</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPeople((p) => Math.max(1, p - 1))}
            disabled={people <= 1}
            className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-30"
            aria-label="Fewer people"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-6 text-center font-semibold">{people}</span>
          <button
            type="button"
            onClick={() => setPeople((p) => Math.min(maxPeople, p + 1))}
            disabled={people >= maxPeople}
            className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-stone-300 transition hover:ring-stone-900 disabled:opacity-30"
            aria-label="More people"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <dl className="mt-6 space-y-2 border-t border-stone-100 pt-4 text-sm">
        <div className="flex justify-between text-stone-600">
          <dt>
            {formatNaira(tour.price_per_person)} × {people} {people === 1 ? 'person' : 'people'}
          </dt>
          <dd>{formatNaira(price.subtotal)}</dd>
        </div>
        <div className="flex justify-between text-stone-600">
          <dt>Service fee</dt>
          <dd>{formatNaira(price.serviceFee)}</dd>
        </div>
        <div className="flex justify-between border-t border-stone-100 pt-2 font-semibold text-ink">
          <dt>Total</dt>
          <dd>{formatNaira(price.total)}</dd>
        </div>
      </dl>

      {error && (
        <div className="mt-4">
          <Alert>{error}</Alert>
        </div>
      )}

      {isOwner ? (
        <Link
          to={`/guide/tours/${tour.id}/edit`}
          className="mt-6 block rounded-xl bg-stone-900 py-3 text-center font-semibold text-white hover:bg-stone-800"
        >
          Edit your tour
        </Link>
      ) : (
        <button
          onClick={handleBook}
          disabled={submitting || (validDay && spotsLeft === 0)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 py-3 font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? 'Sending…' : user ? 'Request to book' : 'Log in to book'}
        </button>
      )}
      <p className="mt-3 text-center text-xs text-stone-500">You won't be charged yet — the guide confirms first.</p>
    </div>
  )
}

export default function TourDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: tour, loading, error } = useAsync(() => fetchTour(id), id)
  const [photoIndex, setPhotoIndex] = useState(null)

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="shimmer h-5 w-32 rounded-full" />
        <div className="shimmer mt-6 h-80 rounded-4xl md:h-112" />
        <div className="shimmer mt-10 h-10 w-1/2 rounded-full" />
      </div>
    )
  }
  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <Alert>Could not load this tour: {error}</Alert>
      </div>
    )
  }
  if (!tour) return <NotFound />

  const isOwner = user?.id === tour.guide_id
  const Icon = CATEGORY_ICONS[tour.category]
  const stops = (tour.itinerary ?? '').split('\n').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        to="/stays?mode=tours"
        className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to tours
      </Link>

      {isOwner && (
        <div className="mt-4 flex flex-col justify-between gap-3 rounded-2xl bg-emerald-50 px-5 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200 sm:flex-row sm:items-center">
          <span>This is your tour{tour.status === 'paused' ? ' — it is paused and hidden from search.' : '.'}</span>
          <Link to="/guide/tours" className="font-semibold underline underline-offset-4">
            Manage my tours
          </Link>
        </div>
      )}

      <div className="mt-6">
        <Gallery tour={tour} onOpen={setPhotoIndex} />
      </div>

      <div className="mt-12 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <motion.div variants={stagger(0.08, 0.2)} initial="hidden" animate="show">
            <motion.p variants={fadeUp} className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-700">
              {Icon && <Icon className="h-4 w-4" />} {categoryLabel(tour.category)}
            </motion.p>
            <motion.h1 variants={fadeUp} className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight text-ink sm:text-5xl">
              <TypeWriter text={tour.title} speed={28} />
            </motion.h1>
            <motion.p variants={fadeUp} className="mt-3 flex items-center gap-1.5 text-stone-500">
              <MapPin className="h-4 w-4" /> {tour.city}, Nigeria
            </motion.p>
          </motion.div>

          <Reveal delay={0.1} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Fact icon={Clock} label="Duration" value={formatDuration(tour.duration_hours)} />
            <Fact icon={Users} label="Group size" value={`Up to ${tour.max_group}`} />
            <Fact icon={CalendarDays} label="Runs" value={formatDays(tour.days)} />
            <Fact icon={Languages} label="Language" value={tour.languages || 'English'} />
          </Reveal>

          <Reveal className="mt-12 border-t border-black/5 pt-10">
            <h2 className="font-display text-2xl text-ink">About this tour</h2>
            <p className="mt-4 whitespace-pre-line text-lg leading-relaxed text-stone-600">
              {tour.description || 'The guide has not added a description yet.'}
            </p>
          </Reveal>

          {stops.length > 0 && (
            <Reveal className="mt-12 border-t border-black/5 pt-10">
              <h2 className="flex items-center gap-2 font-display text-2xl text-ink">
                <Route className="h-5 w-5 text-emerald-700" /> Itinerary
              </h2>
              <ol className="relative mt-6 space-y-5 border-l-2 border-emerald-100 pl-6">
                {stops.map((stop, i) => (
                  <li key={i} className="relative">
                    <span className="absolute -left-[33px] grid h-6 w-6 place-items-center rounded-full bg-emerald-800 text-xs font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="text-stone-700">{stop}</p>
                  </li>
                ))}
              </ol>
            </Reveal>
          )}

          <Reveal className="mt-12 grid gap-8 border-t border-black/5 pt-10 sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-stone-900">What's included</h3>
              {tour.included?.length ? (
                <ul className="mt-3 space-y-2 text-sm text-stone-600">
                  {tour.included.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-700" /> {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-stone-500">Ask the guide for details.</p>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-stone-900">Meeting point</h3>
              <p className="mt-3 flex items-start gap-2 text-sm text-stone-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                {tour.meeting_point || 'Shared by the guide after booking.'}
              </p>
              <p className="mt-2 flex items-center gap-2 text-sm text-stone-600">
                <Clock className="h-4 w-4 text-emerald-700" /> Starts at {formatTime(tour.start_time)}
              </p>
            </div>
          </Reveal>

          <Reveal className="mt-12 flex items-start gap-4 border-t border-black/5 pt-10">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-800 text-white">
              <UserRound className="h-6 w-6" />
            </span>
            <div>
              <h2 className="font-display text-2xl text-ink">Your guide{tour.guide?.first_name ? `: ${tour.guide.first_name}` : ''}</h2>
              <p className="mt-2 leading-relaxed text-stone-600">
                {tour.guide?.bio || 'A local guide who knows the city inside out.'}
              </p>
            </div>
          </Reveal>
        </div>

        <aside>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8, ease }}
            className="sticky top-24 z-10"
          >
            <BookingBox tour={tour} isOwner={isOwner} />
          </motion.div>
        </aside>
      </div>

      <Lightbox photos={tour.photos ?? []} index={photoIndex} onClose={() => setPhotoIndex(null)} onChange={setPhotoIndex} />
    </div>
  )
}
