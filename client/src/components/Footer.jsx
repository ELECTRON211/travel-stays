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
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-8">
        <div>
          <Logo light />
          <p className="mt-4 text-sm leading-relaxed">
            Verified places to stay and local experiences, booked in one place.
          </p>
        </div>

        {columns.map((column) => (
          <div key={column.title}>
            <h3 className="text-sm font-semibold text-white">{column.title}</h3>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-sm hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-800">
        <p className="mx-auto max-w-7xl px-4 py-6 text-xs sm:px-6 lg:px-8">
          © {new Date().getFullYear()} Travel &amp; Stays. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
