import { Link } from 'react-router-dom'
import Logo from './Logo'

const columns = [
  {
    title: 'Explore',
    links: [
      { to: '/stays', label: 'All stays' },
      { to: '/stays?city=Lagos', label: 'Stays in Lagos' },
      { to: '/stays?city=Abuja', label: 'Stays in Abuja' },
      { to: '/stays?city=Calabar', label: 'Stays in Calabar' },
    ],
  },
  {
    title: 'Hosting',
    links: [
      { to: '/signup?role=host', label: 'Become a host' },
      { to: '/signup?role=guide', label: 'Become a tour guide' },
    ],
  },
  {
    title: 'Account',
    links: [
      { to: '/login', label: 'Log in' },
      { to: '/signup', label: 'Create account' },
    ],
  },
]

export default function Footer() {
  return (
    <footer className="relative mt-12 overflow-hidden bg-ink text-stone-400">
      <div className="absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Logo light />
            <p className="mt-6 max-w-sm font-display text-3xl leading-snug text-white">
              Wherever you're headed, <em className="text-emerald-400">feel at home.</em>
            </p>
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

        <div className="mt-16 flex flex-col gap-2 border-t border-white/10 py-8 text-xs sm:flex-row sm:justify-between">
          <p>© {new Date().getFullYear()} Travel &amp; Stays. All rights reserved.</p>
          <p>Built for travellers across Nigeria.</p>
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
