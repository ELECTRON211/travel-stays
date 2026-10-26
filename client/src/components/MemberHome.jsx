import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  Compass,
  Flag,
  Heart,
  Inbox,
  LayoutDashboard,
  Luggage,
  MapPin,
  Plus,
  ShieldCheck,
  Users,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSaved } from '../context/SavedContext'
import { usePresence } from '../context/PresenceContext'
import { useAsync } from '../hooks/useAsync'
import { fetchHostBookings, fetchMyTrips } from '../lib/bookings'
import { fetchHostListings } from '../lib/listings'
import { fetchGuideTourBookings, fetchGuideTours, fetchMyTourBookings } from '../lib/tours'
import { fetchAdminStats } from '../lib/admin'
import { formatLongDate, nightsBetween, todayISO } from '../lib/dates'
import { images } from '../lib/images'
import { ease, fadeUp, stagger } from '../lib/motion'
import { ListingCover } from './ListingCard'
import SearchBar from './SearchBar'
import TypeWriter from './TypeWriter'

const ROLE_LABELS = { traveler: 'Traveller', host: 'Host', guide: 'Tour guide', admin: 'Admin' }

const SUBTITLES = {
  traveler: 'Where to next? Pick up where you left off, or find somewhere new.',
  host: 'Here’s what’s happening with your places today.',
  guide: 'Here’s what’s happening with your tours today.',
  admin: 'Here’s a quick look at the platform. The full picture is on your dashboard.',
}

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

// "today", "tomorrow", "in 5 days"
function whenLabel(isoDate) {
  const days = nightsBetween(todayISO(), isoDate)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

const activeStatus = (s) => s === 'pending' || s === 'confirmed'

// ---------------------------------------------------------------- building blocks

function Stat({ icon: Icon, label, value, to, tone = 'emerald' }) {
  const tones = {
    emerald: 'bg-emerald-50 text-emerald-800',
    amber: 'bg-amber-50 text-amber-800',
    sky: 'bg-sky-50 text-sky-800',
    red: 'bg-red-50 text-red-700',
  }
  const body = (
    <>
      <span className={`grid h-11 w-11 place-items-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <span>
        <span className="block font-display text-3xl leading-none text-stone-900">{value ?? '—'}</span>
        <span className="mt-1 block text-sm text-stone-500">{label}</span>
      </span>
    </>
  )
  const className =
    'flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5 transition hover:-translate-y-0.5 hover:shadow-md'
  return (
    <motion.div variants={fadeUp}>
      {to ? (
        <Link to={to} className={className}>
          {body}
        </Link>
      ) : (
        <div className={className}>{body}</div>
      )}
    </motion.div>
  )
}

function Action({ to, icon: Icon, label, primary = false }) {
  return (
    <Link
      to={to}
      className={`group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
        primary
          ? 'bg-emerald-800 text-white hover:bg-emerald-900'
          : 'bg-white text-stone-800 ring-1 ring-stone-300 hover:ring-stone-900'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </Link>
  )
}

// A big card for the next trip / next guest / next departure.
function Spotlight({ eyebrow, title, subtitle, place, date, to, cta, empty }) {
  if (!place) {
    return (
      <motion.div
        variants={fadeUp}
        className="flex flex-col justify-center rounded-3xl border-2 border-dashed border-stone-300 bg-white/70 p-8 text-center lg:col-span-2"
      >
        <p className="font-display text-2xl text-stone-900">{empty.title}</p>
        <p className="mt-1 text-stone-500">{empty.text}</p>
        <div className="mt-6 flex justify-center">
          <Action to={empty.to} icon={ArrowRight} label={empty.cta} primary />
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div variants={fadeUp} className="lg:col-span-2">
      <Link
        to={to}
        className="group grid overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-stone-900/5 transition hover:shadow-xl sm:grid-cols-5"
      >
        <div className="relative aspect-video sm:col-span-2 sm:aspect-auto">
          <ListingCover listing={place} className="transition-transform duration-700 group-hover:scale-105" />
        </div>
        <div className="flex flex-col justify-between gap-4 p-6 sm:col-span-3 sm:p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-800">{eyebrow}</p>
            <h3 className="mt-2 font-display text-3xl leading-tight text-stone-900">{title}</h3>
            {subtitle && <p className="mt-1 text-stone-500">{subtitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-stone-600">
            {place.city && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-emerald-800" /> {place.city}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-emerald-800" /> {formatLongDate(date)} · {whenLabel(date)}
            </span>
          </div>
          <span className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-emerald-800">
            {cta} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}

function VerifyNudge({ role }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-start justify-between gap-4 rounded-2xl bg-emerald-900 p-6 text-white sm:flex-row sm:items-center"
    >
      <div className="flex items-start gap-4">
        <ShieldCheck className="mt-0.5 h-7 w-7 shrink-0 text-emerald-300" />
        <div>
          <p className="font-semibold">Get the Verified badge</p>
          <p className="text-sm text-emerald-50/80">
            Travellers book verified {role === 'guide' ? 'guides' : 'hosts'} more often. It takes two photos.
          </p>
        </div>
      </div>
      <Link
        to="/profile"
        className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-50"
      >
        Verify my ID
      </Link>
    </motion.div>
  )
}

// ---------------------------------------------------------------- one panel per role

function TravellerPanel({ userId }) {
  const saved = useSaved()
  const trips = useAsync(() => fetchMyTrips(userId), `trips:${userId}`)
  const tours = useAsync(() => fetchMyTourBookings(userId), `tours:${userId}`)
  const today = todayISO()

  const upcoming = (trips.data ?? [])
    .filter((t) => activeStatus(t.status) && t.check_out >= today)
    .sort((a, b) => a.check_in.localeCompare(b.check_in))
  const next = upcoming[0]
  const upcomingTours = (tours.data ?? []).filter((b) => activeStatus(b.status) && b.tour_date >= today)

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-3">
        <Spotlight
          eyebrow={next?.status === 'pending' ? 'Next trip · awaiting host' : 'Your next trip'}
          title={next?.listing?.title}
          subtitle={next ? `${next.guests} ${next.guests === 1 ? 'guest' : 'guests'}` : null}
          place={next?.listing}
          date={next?.check_in}
          to={next ? `/trips/${next.id}` : '/trips'}
          cta={next?.status === 'confirmed' && next.payment_status !== 'paid' ? 'Pay now' : 'View trip'}
          empty={{ title: 'No trips planned yet', text: 'Your next adventure is a search away.', to: '/stays', cta: 'Find a stay' }}
        />
        <div className="grid gap-5">
          <Stat icon={Heart} label="Saved stays" value={saved?.count} to="/saved" tone="red" />
          <Stat icon={Compass} label="Upcoming tours" value={upcomingTours.length} to="/trips?tab=tours" tone="sky" />
          <Stat icon={Luggage} label="Upcoming stays" value={upcoming.length} to="/trips" />
        </div>
      </div>
      <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
        <Action to="/stays" icon={BedDouble} label="Explore stays" primary />
        <Action to="/stays?mode=tours" icon={Compass} label="Explore tours" />
        <Action to="/trips" icon={Luggage} label="My trips" />
        <Action to="/saved" icon={Heart} label="Saved" />
      </motion.div>
    </>
  )
}

function HostPanel({ user }) {
  const bookings = useAsync(() => fetchHostBookings(user.id), `host-bookings:${user.id}`)
  const listings = useAsync(() => fetchHostListings(user.id), `host-listings:${user.id}`)
  const today = todayISO()

  const all = bookings.data ?? []
  const requests = all.filter((b) => b.status === 'pending' && b.check_out >= today)
  const arriving = all.filter((b) => b.status === 'confirmed' && b.check_in >= today)
  const next = arriving[0] // already ordered by check-in
  const live = (listings.data ?? []).filter((l) => l.status === 'active').length

  return (
    <>
      {!user.verified && (
        <div className="mb-5">
          <VerifyNudge role="host" />
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <Spotlight
          eyebrow="Next arrival"
          title={next?.guest_name}
          subtitle={next?.listing?.title}
          place={next?.listing}
          date={next?.check_in}
          to="/host/listings"
          cta="Open my listings"
          empty={{ title: 'No guests arriving yet', text: 'Confirmed bookings will show up here.', to: '/host/listings', cta: 'Manage listings' }}
        />
        <div className="grid gap-5">
          <Stat icon={Inbox} label="Requests waiting" value={requests.length} to="/host/listings" tone="amber" />
          <Stat icon={BedDouble} label="Live listings" value={live} to="/host/listings" />
          <Stat icon={Users} label="Guests coming" value={arriving.length} to="/host/listings" tone="sky" />
        </div>
      </div>
      <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
        <Action to="/host/listings" icon={LayoutDashboard} label="My listings" primary />
        <Action to="/host/listings/new" icon={Plus} label="List a new place" />
        <Action to="/stays" icon={BedDouble} label="Browse stays" />
      </motion.div>
    </>
  )
}

function GuidePanel({ user }) {
  const bookings = useAsync(() => fetchGuideTourBookings(user.id), `guide-bookings:${user.id}`)
  const tours = useAsync(() => fetchGuideTours(user.id), `guide-tours:${user.id}`)
  const today = todayISO()

  const all = bookings.data ?? []
  const requests = all.filter((b) => b.status === 'pending' && b.tour_date >= today)
  const departures = all.filter((b) => b.status === 'confirmed' && b.tour_date >= today)
  const next = departures[0] // ordered by date
  const guests = departures.reduce((n, b) => n + b.people, 0)
  const live = (tours.data ?? []).filter((t) => t.status === 'active').length

  return (
    <>
      {!user.verified && (
        <div className="mb-5">
          <VerifyNudge role="guide" />
        </div>
      )}
      <div className="grid gap-5 lg:grid-cols-3">
        <Spotlight
          eyebrow="Next departure"
          title={next?.tour?.title}
          subtitle={next ? `${next.people} ${next.people === 1 ? 'person' : 'people'} booked` : null}
          place={next?.tour}
          date={next?.tour_date}
          to="/guide/tours"
          cta="Open my tours"
          empty={{ title: 'No departures yet', text: 'Confirmed tour bookings will show up here.', to: '/guide/tours', cta: 'Manage tours' }}
        />
        <div className="grid gap-5">
          <Stat icon={Inbox} label="Requests waiting" value={requests.length} to="/guide/tours" tone="amber" />
          <Stat icon={Compass} label="Live tours" value={live} to="/guide/tours" />
          <Stat icon={Users} label="Guests coming" value={guests} to="/guide/tours" tone="sky" />
        </div>
      </div>
      <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
        <Action to="/guide/tours" icon={LayoutDashboard} label="My tours" primary />
        <Action to="/guide/tours/new" icon={Plus} label="Create a tour" />
        <Action to="/stays?mode=tours" icon={Compass} label="Browse tours" />
      </motion.div>
    </>
  )
}

function AdminPanel() {
  const { online } = usePresence()
  const { data: s } = useAsync(fetchAdminStats, 'home-admin-stats')

  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Activity} label="Online now" value={online.length} to="/admin" />
        <Stat icon={Users} label="Total users" value={s?.users} to="/admin" tone="sky" />
        <Stat icon={Flag} label="Open reports" value={s?.open_reports} to="/admin" tone="red" />
        <Stat icon={BadgeCheck} label="IDs to review" value={s?.pending_verifications} to="/admin" tone="amber" />
      </div>
      <motion.div variants={fadeUp} className="mt-6 flex flex-wrap gap-3">
        <Action to="/admin" icon={LayoutDashboard} label="Open dashboard" primary />
        <Action to="/stays" icon={BedDouble} label="Browse stays" />
        <Action to="/stays?mode=tours" icon={Compass} label="Browse tours" />
      </motion.div>
    </>
  )
}

// ---------------------------------------------------------------- the page top

// What logged-in people see instead of the marketing hero: a greeting, a
// search bar and a snapshot of what matters to their role.
export default function MemberHome() {
  const { user } = useAuth()
  const firstName = user.fullName.split(' ')[0]
  const role = user.role in SUBTITLES ? user.role : 'traveler'

  return (
    <>
      <section className="relative overflow-hidden rounded-b-[2.5rem] bg-ink pb-44 pt-32 sm:pb-48">
        <motion.img
          src={images.hero}
          alt=""
          initial={{ scale: 1.15 }}
          animate={{ scale: 1.03 }}
          transition={{ duration: 2.4, ease }}
          className="absolute inset-0 h-full w-full object-cover opacity-45"
        />
        <div className="absolute inset-0 bg-linear-to-b from-stone-950/70 via-stone-950/40 to-stone-950/90" />

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          animate="show"
          className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <motion.p variants={fadeUp} className="flex flex-wrap items-center gap-2 text-sm text-white/70">
            <span className="rounded-full bg-white/15 px-3 py-1 font-semibold text-white backdrop-blur">
              {ROLE_LABELS[role]}
            </span>
            {user.verified && (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/20 px-3 py-1 font-semibold text-emerald-200">
                <ShieldCheck className="h-4 w-4" /> ID verified
              </span>
            )}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-4 font-display text-5xl font-medium leading-tight tracking-tight text-white sm:text-6xl"
          >
            {greeting()}
            {firstName ? ', ' : ''}
            <em className="text-emerald-300"><TypeWriter text={firstName ? `${firstName}.` : '.'} /></em>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 max-w-xl text-lg text-white/75">
            {SUBTITLES[role]}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 max-w-5xl">
            <SearchBar variant="hero" />
          </motion.div>
        </motion.div>
      </section>

      <motion.div
        variants={stagger(0.07, 0.25)}
        initial="hidden"
        animate="show"
        className="relative z-10 mx-auto -mt-28 max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {role === 'host' && <HostPanel user={user} />}
        {role === 'guide' && <GuidePanel user={user} />}
        {role === 'admin' && <AdminPanel />}
        {role === 'traveler' && <TravellerPanel userId={user.id} />}
      </motion.div>
    </>
  )
}
