import { Link } from 'react-router-dom'
import { ArrowRight, Compass, CreditCard, ShieldCheck } from 'lucide-react'
import SearchBar from '../components/SearchBar'
import { ListingGrid } from '../components/ListingCard'
import { useListings } from '../hooks/useListings'
import { useAuth } from '../context/AuthContext'

const popularCities = ['Lagos', 'Abuja', 'Calabar', 'Port Harcourt', 'Ibadan']

const features = [
  {
    icon: ShieldCheck,
    title: 'Verified hosts',
    text: 'Every host and guide is ID-verified before their listing goes live.',
  },
  {
    icon: CreditCard,
    title: 'Secure payments',
    text: 'Pay safely online. Hosts are paid only after you check in.',
  },
  {
    icon: Compass,
    title: 'Stays and tours together',
    text: 'Book a place to stay and things to do at your destination in one trip.',
  },
]

export default function Home() {
  const { user } = useAuth()
  const { listings, loading, error } = useListings({ limit: 8 })

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 md:pt-24 lg:px-8">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-50">
              Stays · Tours · Experiences
            </span>
            <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
              Find verified places to stay, wherever you travel.
            </h1>
            <p className="mt-4 text-lg text-emerald-50/90">
              Discover trusted apartments, guesthouses and local tours across Nigeria, booked in one place.
            </p>
          </div>

          <div className="mt-10">
            <SearchBar />
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <span className="text-sm text-emerald-50/80">Popular:</span>
            {popularCities.map((city) => (
              <Link
                key={city}
                to={`/stays?city=${encodeURIComponent(city)}`}
                className="rounded-full border border-white/30 px-3 py-1 text-sm text-white transition hover:bg-white/15"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest stays */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Latest stays</h2>
            <p className="mt-1 text-gray-500">Newly listed places from our hosts</p>
          </div>
          <Link
            to="/stays"
            className="hidden items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800 sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <ListingGrid listings={listings} loading={loading} error={error} skeletons={4} />

        {!loading && !error && listings.length === 0 && (
          <p className="rounded-2xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
            No stays listed yet. Be the first host!
          </p>
        )}
      </section>

      {/* Why us */}
      <section className="bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold tracking-tight text-gray-900">
            Why travel with Travel &amp; Stays
          </h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <div key={title} className="rounded-2xl border border-gray-200 bg-white p-6">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Icon className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-semibold text-gray-900">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Host call-to-action */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gray-900 p-8 md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-2xl font-bold text-white">Have a space or run tours?</h2>
            <p className="mt-2 max-w-xl text-gray-400">
              List your apartment, guesthouse or experience and reach travellers already planning their trip.
            </p>
          </div>
          <Link
            to="/signup?role=host"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-white hover:bg-emerald-600"
          >
            Become a host <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </>
  )
}
