import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { nightsBetween, parseISODate, toISODate, todayISO } from '../lib/dates'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

function Month({ year, month, checkIn, rangeEnd, today, onPick, onHover }) {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // weeks start on Monday
  const days = new Date(year, month + 1, 0).getDate()
  const cells = [
    ...Array(offset).fill(null),
    ...Array.from({ length: days }, (_, i) => toISODate(new Date(year, month, i + 1))),
  ]

  return (
    <div>
      <p className="mb-4 text-center text-sm font-semibold text-stone-900">
        {first.toLocaleDateString('en-NG', { month: 'long', year: 'numeric' })}
      </p>
      <div className="grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wider text-stone-400">
        {WEEKDAYS.map((day) => (
          <span key={day} className="pb-2">
            {day}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((iso, i) => {
          if (!iso) return <span key={`blank-${i}`} />

          const disabled = isDisabled(iso)
          const isStart = iso === checkIn
          const isEnd = iso === rangeEnd
          const inRange = checkIn && rangeEnd && iso > checkIn && iso < rangeEnd
          const band = inRange
            ? 'bg-emerald-50'
            : isStart && rangeEnd
              ? 'rounded-l-full bg-emerald-50'
              : isEnd && checkIn
                ? 'rounded-r-full bg-emerald-50'
                : ''

          return (
            <div key={iso} className={band}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onPick(iso)}
                onMouseEnter={() => onHover(iso)}
                className={`mx-auto grid h-10 w-10 place-items-center rounded-full text-sm transition-colors ${
                  isStart || isEnd
                    ? 'bg-emerald-800 font-semibold text-white'
                    : disabled
                      ? 'cursor-not-allowed text-stone-300 line-through'
                      : 'text-stone-800 hover:ring-1 hover:ring-stone-900'
                }`}
              >
                {Number(iso.slice(8))}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Two-month calendar (one on phones). First click picks check-in, second
// picks check-out; hovering previews the range in between. `blockedRanges`
// ([{ check_in, check_out }]) are nights already booked by someone else.
export default function DateRangePicker({ checkIn, checkOut, onChange, blockedRanges = [] }) {
  const today = todayISO()
  const start = parseISODate(checkIn || today)
  const [view, setView] = useState({ year: start.getFullYear(), month: start.getMonth() })
  const [hover, setHover] = useState('')

  const now = new Date()
  const atFirstMonth = view.year === now.getFullYear() && view.month === now.getMonth()
  const next = new Date(view.year, view.month + 1, 1)
  const rangeEnd = checkOut || (checkIn && hover > checkIn ? hover : '')

  const nightTaken = (iso) => blockedRanges.some((r) => iso >= r.check_in && iso < r.check_out)
  // While choosing check-out, the stay can't run past the next booked night
  // (checking out on the morning someone else arrives is fine).
  const choosingEnd = Boolean(checkIn && !checkOut)
  const lastCheckOut = choosingEnd
    ? blockedRanges.map((r) => r.check_in).filter((d) => d > checkIn).sort()[0]
    : undefined

  function isDisabled(iso) {
    if (iso < today) return true
    if (choosingEnd && iso > checkIn) return Boolean(lastCheckOut && iso > lastCheckOut)
    return nightTaken(iso)
  }

  function shift(delta) {
    const d = new Date(view.year, view.month + delta, 1)
    setView({ year: d.getFullYear(), month: d.getMonth() })
  }

  function pick(iso) {
    if (!checkIn || checkOut || iso <= checkIn) onChange({ checkIn: iso, checkOut: '' })
    else onChange({ checkIn, checkOut: iso })
  }

  const monthProps = { checkIn, rangeEnd, isDisabled, onPick: pick, onHover: setHover }

  return (
    <div onMouseLeave={() => setHover('')}>
      <div className="relative">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={atFirstMonth}
          className="absolute left-0 top-0 grid h-8 w-8 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 disabled:opacity-30"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => shift(1)}
          className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div className="grid gap-10 sm:grid-cols-2">
          <Month year={view.year} month={view.month} {...monthProps} />
          <div className="hidden sm:block">
            <Month year={next.getFullYear()} month={next.getMonth()} {...monthProps} />
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-stone-100 pt-4 text-sm">
        <span className="text-stone-500">
          {checkIn && checkOut
            ? `${nightsBetween(checkIn, checkOut)} ${nightsBetween(checkIn, checkOut) === 1 ? 'night' : 'nights'}`
            : checkIn
              ? 'Now pick your check-out date'
              : 'Pick your check-in date'}
        </span>
        {(checkIn || checkOut) && (
          <button
            type="button"
            onClick={() => onChange({ checkIn: '', checkOut: '' })}
            className="font-semibold text-stone-900 underline underline-offset-4"
          >
            Clear dates
          </button>
        )}
      </div>
    </div>
  )
}
