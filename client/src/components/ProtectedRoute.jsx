import { Link, Navigate, useLocation } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// Wraps pages that need a logged-in user (and optionally a specific role).
// Logged-out visitors are sent to /login and brought back afterwards.
export default function ProtectedRoute({ role, children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }

  if (role && user.role !== role) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-100">
          <Lock className="h-6 w-6 text-stone-500" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-stone-900">This page is for {role}s</h1>
        <p className="mt-2 text-stone-500">
          You're signed in as a {user.role}. Create a {role} account to use this page.
        </p>
        <Link to="/" className="mt-8 rounded-xl bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900">
          Back to home
        </Link>
      </div>
    )
  }

  return children
}
