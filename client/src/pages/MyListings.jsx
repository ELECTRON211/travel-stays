import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, Home, Pause, Play, Plus, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { deleteListing, fetchHostListings, updateListingStatus } from '../lib/listings'
import { formatNaira } from '../lib/format'
import { propertyLabel } from '../lib/constants'
import { ListingCover } from '../components/ListingCard'
import { Alert } from '../components/AuthShell'

function StatusBadge({ status }) {
  return status === 'active' ? (
    <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">Active</span>
  ) : (
    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Paused</span>
  )
}

const actionClass =
  'flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50'

export default function MyListings() {
  const { user } = useAuth()
  const { data: listings, loading, error, reload } = useAsync(() => fetchHostListings(user.id), user.id)
  const [busyId, setBusyId] = useState(null)
  const [actionError, setActionError] = useState('')

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">My listings</h1>
          <p className="mt-2 text-gray-500">Manage the places you host. Paused listings are hidden from search.</p>
        </div>
        <Link
          to="/host/listings/new"
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" /> New listing
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {(error || actionError) && <Alert>{error || actionError}</Alert>}

        {loading && !listings &&
          Array.from({ length: 3 }, (_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100" />)}

        {listings?.length === 0 && (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-gray-300 px-6 py-16 text-center">
            <Home className="h-12 w-12 text-gray-300" />
            <h2 className="mt-4 font-semibold text-gray-900">You haven't listed a place yet</h2>
            <p className="mt-1 text-sm text-gray-500">Create your first listing to start getting bookings.</p>
            <Link
              to="/host/listings/new"
              className="mt-6 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              List your place
            </Link>
          </div>
        )}

        {listings?.map((listing) => (
          <div
            key={listing.id}
            className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center"
          >
            <div className="aspect-[4/3] w-full shrink-0 overflow-hidden rounded-xl sm:w-40">
              <ListingCover listing={listing} />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate font-semibold text-gray-900">{listing.title}</h2>
                <StatusBadge status={listing.status} />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                {propertyLabel(listing.property_type)} · {listing.city} · up to {listing.max_guests} guests
              </p>
              <p className="mt-2 text-sm text-gray-600">
                <span className="font-bold text-gray-900">{formatNaira(listing.price_per_night)}</span> / night
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link to={`/listings/${listing.id}`} className={actionClass}>
                <Eye className="h-4 w-4" /> View
              </Link>
              <button onClick={() => toggleStatus(listing)} disabled={busyId === listing.id} className={actionClass}>
                {listing.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                {listing.status === 'active' ? 'Pause' : 'Activate'}
              </button>
              <button
                onClick={() => remove(listing)}
                disabled={busyId === listing.id}
                className={`${actionClass} border-red-200 text-red-600 hover:bg-red-50`}
              >
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
