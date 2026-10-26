import { Link } from 'react-router-dom'
import { CreditCard, Lock, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import Logo from './Logo'
import TypeWriter from './TypeWriter'

const explore = {
  title: 'Explore',
  links: [
    { to: '/stays', label: 'All stays' },
    { to: '/stays?city=Lagos', label: 'Stays in Lagos' },
    { to: '/stays?city=Abuja', label: 'Stays in Abuja' },
    { to: '/stays?city=Calabar', label: 'Stays in Calabar' },
  ],
}

const support = {
  title: 'Support',
  links: [
    { to: '/about', label: 'About us' },
    { to: '/help', label: 'Help centre' },
    { to: '/help#cancellation', label: 'Cancellation options' },
    { to: '/safety', label: 'Trust & safety' },
    { to: '/help#contact', label: 'Contact us' },
  ],
}

// The Hosting and Account columns depend on who is logged in, so a logged-in
// user never sees "Log in" or "Create account".
function columnsFor(user) {
  const hosting =
    user?.role === 'host'
      ? [
          { to: '/host/listings', label: 'My listings' },
          { to: '/host/listings/new', label: 'List your place' },
        ]
      : user
        ? [{ to: '/stays?mode=tours', label: 'Tours & experiences' }]
        : [
            { to: '/signup?role=host', label: 'Become a host' },
            { to: '/signup?role=guide', label: 'Become a tour guide' },
          ]

  const account = user
    ? [
        { to: '/profile', label: 'Profile' },
        { to: '/trips', label: 'My trips' },
        { to: '/saved', label: 'Saved' },
      ]
    : [
        { to: '/login', label: 'Log in' },
        { to: '/signup', label: 'Create account' },
      ]

  return [explore, { title: 'Hosting', links: hosting }, support, { title: 'Account', links: account }]
}

export default function Footer() {
  const { user } = useAuth()
  const columns = columnsFor(user)

  return (
    <footer className="relative mt-12 overflow-hidden bg-ink text-stone-400">
      <div className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-6">
          <div className="sm:col-span-2">
            <Logo light />
            <p className="mt-6 max-w-sm font-display text-3xl leading-snug text-white">
              Wherever you're headed, <em className="text-emerald-400"><TypeWriter text="feel at home." /></em>
            </p>
            <Link
              to="/help#contact"
              className="mt-6 inline-flex items-center gap-2 text-sm transition-colors hover:text-emerald-400"
            >
              <Mail className="h-4 w-4" /> Contact us
            </Link>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                <Lock className="h-3.5 w-3.5 text-emerald-400" /> Secure connection
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 ring-1 ring-white/10">
                <CreditCard className="h-3.5 w-3.5 text-emerald-400" /> Secured by Paystack
              </span>
            </div>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-white">{column.title}</h3>
              <ul className="mt-5 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.to} className="text-sm transition-colors hover:text-emerald-400">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-white/10 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Travel &amp; Stays. All rights reserved.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/terms" className="transition-colors hover:text-emerald-400">
              Terms of Service
            </Link>
            <Link to="/privacy" className="transition-colors hover:text-emerald-400">
              Privacy Policy
            </Link>
            <Link to="/help" className="transition-colors hover:text-emerald-400">
              Help centre
            </Link>
          </nav>
        </div>
      </div>

      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[3vw] select-none whitespace-nowrap text-center font-display text-[15vw] leading-none text-white/[0.04]"
      >
        Travel &amp; Stays
      </p>
    </footer>
  )
}
