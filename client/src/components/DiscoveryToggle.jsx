import { motion } from 'motion/react'
import { BedDouble, Compass, Route } from 'lucide-react'

const MODES = [
  { value: 'stays', label: 'Stays', short: 'Stays', icon: BedDouble },
  { value: 'tours', label: 'Tours & Experiences', short: 'Tours', icon: Compass },
  { value: 'trips', label: 'Combined Trips', short: 'Trips', icon: Route },
]

// Segmented control for switching between what the visitor is looking for.
// `dark` is for use on top of a photo.
export default function DiscoveryToggle({ value, onChange, dark = false }) {
  return (
    <div
      role="tablist"
      aria-label="What are you looking for?"
      className={`inline-flex rounded-full p-1 ${
        dark ? 'bg-white/10 ring-1 ring-white/20 backdrop-blur-md' : 'bg-stone-200/70'
      }`}
    >
      {MODES.map(({ value: mode, label, short, icon: Icon }) => {
        const active = mode === value
        return (
          <button
            key={mode}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(mode)}
            className={`relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'text-stone-900' : dark ? 'text-white/80 hover:text-white' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {active && (
              <motion.span
                layoutId={dark ? 'discovery-dark' : 'discovery-light'}
                className="absolute inset-0 rounded-full bg-white shadow-sm"
                transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              />
            )}
            <Icon className="relative h-4 w-4" />
            <span className="relative hidden sm:inline">{label}</span>
            <span className="relative sm:hidden">{short}</span>
          </button>
        )
      })}
    </div>
  )
}
