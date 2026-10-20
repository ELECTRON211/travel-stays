import { Link } from 'react-router-dom'
import { Plane } from 'lucide-react'

export default function Logo({ light = false }) {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white shadow-sm">
        <Plane className="h-5 w-5 -rotate-45" />
      </span>
      <span className={`text-lg font-bold tracking-tight ${light ? 'text-white' : 'text-gray-900'}`}>
        Travel<span className="text-emerald-500">&amp;</span>Stays
      </span>
    </Link>
  )
}
