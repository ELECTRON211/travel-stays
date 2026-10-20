import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'

function Field({ icon: Icon, label, children }) {
  return (
    <label className="flex flex-1 cursor-text items-center gap-3 rounded-2xl px-5 py-3 transition-colors hover:bg-gray-100/80 lg:rounded-full">
      <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
      <span className="flex w-full flex-col">
        <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-gray-500">{label}</span>
        {children}
      </span>
    </label>
  )
}

const inputClass = 'w-full bg-transparent text-sm font-medium text-gray-900 placeholder-gray-400 outline-none'

const Divider = () => <div className="hidden h-10 w-px bg-gray-200 lg:block" />

// Sends the search to /stays?city=...&guests=... so results can be shared
// as a link and survive a page refresh.
export default function SearchBar({ initial = {}, variant = 'page' }) {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [city, setCity] = useState(initial.city ?? '')
  const [checkIn, setCheckIn] = useState(initial.checkin ?? '')
  const [checkOut, setCheckOut] = useState(initial.checkout ?? '')
  const [guests, setGuests] = useState(initial.guests ?? '')

  function handleSubmit(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (city.trim()) params.set('city', city.trim())
    if (checkIn) params.set('checkin', checkIn)
    if (checkOut) params.set('checkout', checkOut)
    if (guests) params.set('guests', guests)
    if (initial.type) params.set('type', initial.type)
    navigate(`/stays?${params}`)
  }

  const surface =
    variant === 'hero'
      ? 'bg-white/95 shadow-2xl shadow-black/30 backdrop-blur-xl'
      : 'bg-white shadow-xl shadow-emerald-950/5 ring-1 ring-black/5'

  return (
    <form
      onSubmit={handleSubmit}
      className={`flex flex-col gap-1 rounded-3xl p-2 lg:flex-row lg:items-center lg:rounded-full ${surface}`}
    >
      <Field icon={MapPin} label="Where">
        <input
          className={inputClass}
          placeholder="Search a city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </Field>
      <Divider />
      <Field icon={CalendarDays} label="Check in">
        <input
          type="date"
          className={inputClass}
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </Field>
      <Divider />
      <Field icon={CalendarDays} label="Check out">
        <input
          type="date"
          className={inputClass}
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </Field>
      <Divider />
      <Field icon={Users} label="Guests">
        <input
          type="number"
          min="1"
          className={inputClass}
          placeholder="Add guests"
          value={guests}
          onChange={(e) => setGuests(e.target.value)}
        />
      </Field>
      <motion.button
        type="submit"
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="flex items-center justify-center gap-2 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-500 px-7 py-4 text-sm font-semibold text-white shadow-lg shadow-emerald-600/30 lg:rounded-full"
      >
        <Search className="h-5 w-5" />
        Search
      </motion.button>
    </form>
  )
}
