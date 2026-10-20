import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarDays, MapPin, Minus, Plus, Search, Users } from 'lucide-react'
import DateRangePicker from './DateRangePicker'
import { DESTINATIONS } from '../lib/constants'
import { formatShortDate } from '../lib/dates'
import { ease } from '../lib/motion'

const labelClass = 'block text-[11px] font-semibold uppercase tracking-[0.15em] text-stone-500'

function Segment({ active, onClick, icon: Icon, label, value, placeholder, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center gap-3 rounded-xl px-5 py-3 text-left transition-all duration-200 ${
        active ? 'bg-white shadow-lg shadow-stone-900/10' : 'hover:bg-stone-900/5'
      } ${className}`}
    >
      <Icon className="h-5 w-5 shrink-0 text-emerald-800" />
      <span className="min-w-0">
        <span className={labelClass}>{label}</span>
        <span className={`block truncate text-sm font-medium ${value ? 'text-stone-900' : 'text-stone-400'}`}>
          {value || placeholder}
        </span>
      </span>
    </button>
  )
}

const Divider = () => <div className="hidden h-10 w-px shrink-0 bg-stone-300/70 lg:block" />

function WherePanel({ query, onPick }) {
  const matches = DESTINATIONS.filter((d) => d.city.toLowerCase().includes(query.trim().toLowerCase()))
  const list = matches.length ? matches : DESTINATIONS

  return (
    <div>
      <p className={`${labelClass} mb-3`}>{matches.length ? 'Popular destinations' : 'No match — try one of these'}</p>
      <div className="grid gap-1">
        {list.map(({ city, note }) => (
          <button
            key={city}
            type="button"
            onClick={() => onPick(city)}
            className="flex items-center gap-4 rounded-xl p-2 text-left transition-colors hover:bg-stone-100"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-stone-100 text-emerald-800">
              <MapPin className="h-5 w-5" />
            </span>
            <span>
              <span className="block text-sm font-semibold text-stone-900">{city}</span>
              <span className="block text-xs text-stone-500">{note}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function Stepper({ label, hint, value, min, max, onChange }) {
  const buttonClass =
    'grid h-9 w-9 place-items-center rounded-full text-stone-600 ring-1 ring-stone-300 transition hover:text-stone-900 hover:ring-stone-900 disabled:pointer-events-none disabled:opacity-30'
  return (
    <div className="flex items-center justify-between py-4">
      <div>
        <p className="font-semibold text-stone-900">{label}</p>
        <p className="text-sm text-stone-500">{hint}</p>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" disabled={value <= min} onClick={() => onChange(value - 1)} className={buttonClass} aria-label={`Fewer ${label}`}>
          <Minus className="h-4 w-4" />
        </button>
        <motion.span
          key={value}
          initial={{ y: -6, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-6 text-center font-semibold tabular-nums text-stone-900"
        >
          {value}
        </motion.span>
        <button type="button" disabled={value >= max} onClick={() => onChange(value + 1)} className={buttonClass} aria-label={`More ${label}`}>
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function GuestsPanel({ guests, onChange }) {
  return (
    <div className="divide-y divide-stone-100">
      <Stepper
        label="Adults"
        hint="Ages 13 or above"
        value={guests.adults}
        min={0}
        max={16}
        onChange={(adults) => onChange({ ...guests, adults })}
      />
      <Stepper
        label="Children"
        hint="Ages 2 – 12"
        value={guests.children}
        min={0}
        max={10}
        onChange={(children) => onChange({ ...guests, children })}
      />
    </div>
  )
}

// Where the dropdown sits under (or above, in the hero) each part of the bar.
const panelWidths = {
  where: 'lg:right-auto lg:w-96',
  dates: 'lg:left-[18%] lg:right-auto lg:w-[42rem]',
  guests: 'lg:left-auto lg:w-80',
}

// Search bar with dropdowns for destination, dates and guests. Sends the
// search to /stays?city=...&guests=... so results can be shared as a link.
export default function SearchBar({ initial = {}, variant = 'page', mode }) {
  const navigate = useNavigate()
  const formRef = useRef(null)
  const cityInputRef = useRef(null)
  const [open, setOpen] = useState(null) // 'where' | 'dates' | 'guests' | null
  const [city, setCity] = useState(initial.city ?? '')
  const [dates, setDates] = useState({ checkIn: initial.checkin ?? '', checkOut: initial.checkout ?? '' })
  const [guests, setGuests] = useState({ adults: Number(initial.guests) || 0, children: 0 })
  const totalGuests = guests.adults + guests.children
  const hero = variant === 'hero'

  // Close the dropdown on a click outside the bar or on Escape.
  useEffect(() => {
    if (!open) return
    function onPointer(e) {
      if (!formRef.current?.contains(e.target)) setOpen(null)
    }
    function onKey(e) {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('mousedown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  function toggle(panel) {
    setOpen(open === panel ? null : panel)
  }

  function handleSubmit(e) {
    e.preventDefault()
    setOpen(null)
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (dates.checkIn) params.set('checkin', dates.checkIn)
    if (dates.checkOut) params.set('checkout', dates.checkOut)
    if (totalGuests) params.set('guests', totalGuests)
    if (initial.type) params.set('type', initial.type)
    if (mode && mode !== 'stays') params.set('mode', mode)
    navigate(`/stays?${params}`)
  }

  const surface = hero
    ? 'bg-white/90 shadow-2xl shadow-black/30 backdrop-blur-md'
    : 'bg-white/90 shadow-xl shadow-stone-900/5 ring-1 ring-stone-900/5 backdrop-blur-md'

  return (
    <form ref={formRef} onSubmit={handleSubmit} className={`relative rounded-2xl p-2 ${surface}`}>
      <div
        className={`flex flex-col gap-1 rounded-xl transition-colors duration-300 lg:flex-row lg:items-center ${
          open ? 'bg-stone-100/80' : ''
        }`}
      >
        <label
          className={`flex flex-1 cursor-text items-center gap-3 rounded-xl px-5 py-3 transition-all duration-200 lg:flex-[1.3] ${
            open === 'where' ? 'bg-white shadow-lg shadow-stone-900/10' : 'hover:bg-stone-900/5'
          }`}
        >
          <MapPin className="h-5 w-5 shrink-0 text-emerald-800" />
          <span className="min-w-0 flex-1">
            <span className={labelClass}>Where</span>
            <input
              ref={cityInputRef}
              className="w-full bg-transparent text-sm font-medium text-stone-900 placeholder-stone-400 outline-none"
              placeholder="Search destinations"
              value={city}
              onFocus={() => setOpen('where')}
              onChange={(e) => {
                setCity(e.target.value)
                setOpen('where')
              }}
              autoComplete="off"
            />
          </span>
        </label>
        <Divider />
        <Segment
          icon={CalendarDays}
          label="Check in"
          value={dates.checkIn && formatShortDate(dates.checkIn)}
          placeholder="Add date"
          active={open === 'dates' && !dates.checkIn}
          onClick={() => toggle('dates')}
        />
        <Divider />
        <Segment
          icon={CalendarDays}
          label="Check out"
          value={dates.checkOut && formatShortDate(dates.checkOut)}
          placeholder="Add date"
          active={open === 'dates' && Boolean(dates.checkIn)}
          onClick={() => toggle('dates')}
        />
        <Divider />
        <Segment
          icon={Users}
          label="Guests"
          value={totalGuests ? `${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'}` : ''}
          placeholder="Add guests"
          active={open === 'guests'}
          onClick={() => toggle('guests')}
        />
        <motion.button
          type="submit"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center justify-center gap-2 rounded-xl bg-emerald-800 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-900/30 transition-colors hover:bg-emerald-900 lg:ml-1"
        >
          <Search className="h-5 w-5" />
          Search
        </motion.button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            key={open}
            initial={{ opacity: 0, y: hero ? -8 : 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: hero ? -8 : 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease }}
            className={`absolute left-0 right-0 z-30 rounded-2xl bg-white p-4 shadow-2xl shadow-stone-900/20 ring-1 ring-stone-900/5 sm:p-6 ${
              hero ? 'bottom-full mb-3' : 'top-full mt-3'
            } ${panelWidths[open]}`}
          >
            {open === 'where' && (
              <WherePanel
                query={city}
                onPick={(picked) => {
                  setCity(picked)
                  setOpen('dates')
                }}
              />
            )}
            {open === 'dates' && (
              <DateRangePicker
                checkIn={dates.checkIn}
                checkOut={dates.checkOut}
                onChange={(next) => {
                  setDates(next)
                  if (next.checkOut) setOpen('guests')
                }}
              />
            )}
            {open === 'guests' && <GuestsPanel guests={guests} onChange={setGuests} />}
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  )
}
