import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { Clock, Leaf, MapPin, Mountain, Palette, Users, UtensilsCrossed } from 'lucide-react'
import { formatNaira } from '../lib/format'
import { fadeUp, stagger } from '../lib/motion'
import { categoryLabel, formatDuration } from '../lib/tours'
import { ListingCardSkeleton, ListingCover } from './ListingCard'

export const CATEGORY_ICONS = { food: UtensilsCrossed, adventure: Mountain, culture: Palette, nature: Leaf }

export default function TourCard({ tour }) {
  const Icon = CATEGORY_ICONS[tour.category] ?? Palette
  return (
    <Link to={`/tours/${tour.id}`} className="group block transition-transform duration-300 ease-out hover:scale-[1.02]">
      <div className="relative aspect-4/3 overflow-hidden rounded-xl bg-stone-200 ring-1 ring-stone-900/5 transition-shadow duration-300 group-hover:shadow-xl group-hover:shadow-stone-900/15">
        <ListingCover listing={tour} className="transition-transform duration-700 ease-out group-hover:scale-105" />
        <div className="absolute inset-0 bg-linear-to-t from-black/45 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-stone-800 shadow-sm backdrop-blur">
          <Icon className="h-3.5 w-3.5 text-emerald-700" /> {categoryLabel(tour.category)}
        </span>
        <span className="absolute bottom-3 left-3 flex items-center gap-1 text-sm font-medium text-white drop-shadow">
          <MapPin className="h-4 w-4" /> {tour.city}
        </span>
      </div>
      <div className="mt-3 px-0.5">
        <h3 className="truncate font-semibold tracking-tight text-stone-900">{tour.title}</h3>
        <p className="mt-0.5 flex items-center gap-3 text-sm text-stone-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(tour.duration_hours)}
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Up to {tour.max_group}
          </span>
        </p>
        <p className="mt-1.5 text-[15px]">
          <span className="font-semibold text-stone-900">{formatNaira(tour.price_per_person)}</span>{' '}
          <span className="text-stone-500">per person</span>
        </p>
      </div>
    </Link>
  )
}

const gridClass = 'grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'

export function TourGrid({ tours, loading, error, skeletons = 4 }) {
  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">Could not load tours: {error}</div>
    )
  }
  if (loading) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletons }, (_, i) => (
          <ListingCardSkeleton key={i} />
        ))}
      </div>
    )
  }
  return (
    <motion.div key={tours.map((t) => t.id).join()} variants={stagger(0.07)} initial="hidden" animate="show" className={gridClass}>
      {tours.map((tour) => (
        <motion.div key={tour.id} variants={fadeUp}>
          <TourCard tour={tour} />
        </motion.div>
      ))}
    </motion.div>
  )
}
