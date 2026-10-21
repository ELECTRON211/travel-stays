import { Link, useParams } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useAsync } from '../hooks/useAsync'
import { fetchListing } from '../lib/listings'
import { Alert } from '../components/AuthShell'
import NewListing from './NewListing'

// Loads a listing and shows the listing form in edit mode — only for its host.
export default function EditListing() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: listing, loading, error } = useAsync(() => fetchListing(id), id)

  if (loading) {
    return (
      <div className="grid place-items-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-700" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Alert>Could not load this listing: {error}</Alert>
      </div>
    )
  }

  if (!listing || listing.host_id !== user.id) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-stone-100">
          <Lock className="h-6 w-6 text-stone-500" />
        </span>
        <h1 className="mt-4 font-display text-2xl text-stone-900">You can only edit your own listings</h1>
        <Link
          to="/host/listings"
          className="mt-8 rounded-full bg-emerald-800 px-6 py-3 font-semibold text-white hover:bg-emerald-900"
        >
          Back to my listings
        </Link>
      </div>
    )
  }

  return <NewListing key={listing.id} existing={listing} />
}
