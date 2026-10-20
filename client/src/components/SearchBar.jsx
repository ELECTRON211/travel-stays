import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarDays, MapPin, Search, Users } from 'lucide-react'

function Field({ icon: Icon, label, children }) {
  return (
    <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 hover:bg-gray-50">
      <Icon className="h-5 w-5 shrink-0 text-emerald-600" />
      <span className="flex w-full flex-col">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</span>
        {children}
      </span>
    </label>
  )
}

const inputClass = 'w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none'

// Sends the search to /stays?city=...&guests=... so results can be shared
// as a link and survive a page refresh.
export default function SearchBar({ initial = {} }) {
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
    navigate(`/stays?${params}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-1 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl shadow-gray-900/5 lg:flex-row lg:items-center"
    >
      <Field icon={MapPin} label="Where">
        <input
          className={inputClass}
          placeholder="Search a city"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
      </Field>
      <div className="hidden h-10 w-px bg-gray-200 lg:block" />
      <Field icon={CalendarDays} label="Check in">
        <input
          type="date"
          className={inputClass}
          min={today}
          value={checkIn}
          onChange={(e) => setCheckIn(e.target.value)}
        />
      </Field>
      <div className="hidden h-10 w-px bg-gray-200 lg:block" />
      <Field icon={CalendarDays} label="Check out">
        <input
          type="date"
          className={inputClass}
          min={checkIn || today}
          value={checkOut}
          onChange={(e) => setCheckOut(e.target.value)}
        />
      </Field>
      <div className="hidden h-10 w-px bg-gray-200 lg:block" />
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
      <button
        type="submit"
        className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Search className="h-5 w-5" />
        Search
      </button>
    </form>
  )
}
