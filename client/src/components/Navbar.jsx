import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { LogOut, Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { initials } from '../lib/format'
import Logo from './Logo'

const links = [
  { to: '/stays', label: 'Stays' },
  { to: '/signup?role=host', label: 'Become a host' },
]

const roleLabels = { traveler: 'Traveler', host: 'Host', guide: 'Guide' }

function navClass({ isActive }) {
  return `text-sm font-medium transition-colors ${
    isActive ? 'text-emerald-700' : 'text-gray-600 hover:text-gray-900'
  }`
}

export default function Navbar() {
  const { user, loading, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const links = linksFor(user)

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} className={navClass} end>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-3 rounded-full border border-gray-200 py-1 pl-3 pr-1 transition hover:shadow-md"
              >
                <span className="text-sm font-medium text-gray-700">
                  {user.fullName.split(' ')[0] || 'Account'}
                </span>
                <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
                  {initials(user.fullName)}
                </span>
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                    <div className="border-b border-gray-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.fullName}</p>
                      <p className="truncate text-xs text-gray-500">{user.email}</p>
                      <span className="mt-2 inline-block rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        {roleLabels[user.role] ?? user.role}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        signOut()
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} className={navClass} onClick={() => setMobileOpen(false)} end>
                {link.label}
              </NavLink>
            ))}
            <hr className="border-gray-100" />
            {user ? (
              <>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                  <p className="text-xs text-gray-500">
                    {user.email} · {roleLabels[user.role] ?? user.role}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    signOut()
                  }}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <div className="flex gap-3">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-gray-300 py-2 text-center text-sm font-medium text-gray-700"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-emerald-600 py-2 text-center text-sm font-semibold text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
