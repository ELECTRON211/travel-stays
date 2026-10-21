// Dates travel through the app as "YYYY-MM-DD" strings in the visitor's local
// time zone. Strings in that format compare correctly with < and >.

export function toISODate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseISODate(value) {
  const [y, m, d] = value.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function todayISO() {
  return toISODate(new Date())
}

export function formatShortDate(value) {
  return parseISODate(value).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' })
}

export function formatLongDate(value) {
  return parseISODate(value).toLocaleDateString('en-NG', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function nightsBetween(checkIn, checkOut) {
  return Math.round((parseISODate(checkOut) - parseISODate(checkIn)) / 86_400_000)
}
