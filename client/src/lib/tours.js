import { supabase } from './supabase'
import { PHOTO_BUCKET, photoPath, uploadPhotos } from './listings'
import { SERVICE_FEE_RATE } from './bookings'
import { parseISODate } from './dates'

// All reads and writes of tours and tour bookings (supabase/migrations/011).

export const TOUR_CATEGORIES = [
  { value: 'food', label: 'Food tours' },
  { value: 'adventure', label: 'Adventure' },
  { value: 'culture', label: 'Culture' },
  { value: 'nature', label: 'Nature' },
]

export const WEEKDAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

export function categoryLabel(value) {
  return TOUR_CATEGORIES.find((c) => c.value === value)?.label ?? 'Experience'
}

// "3 hours", "1.5 hours"
export function formatDuration(hours) {
  const n = Number(hours)
  return `${n % 1 ? n.toFixed(1) : n} ${n === 1 ? 'hour' : 'hours'}`
}

// "Every day", "Weekends", "Mon, Wed, Fri"
export function formatDays(days = []) {
  if (days.length === 7) return 'Every day'
  if (days.length === 2 && days.includes('sat') && days.includes('sun')) return 'Weekends'
  return WEEKDAYS.filter((d) => days.includes(d.value)).map((d) => d.label).join(', ')
}

// Does the tour run on this date ("2026-11-02")?
export function runsOn(tour, isoDate) {
  if (!isoDate) return false
  const day = WEEKDAYS[(parseISODate(isoDate).getDay() + 6) % 7].value // getDay(): 0 = Sunday
  return tour.days?.includes(day)
}

// Same 10% service fee as stays; the database works out the real total.
export function tourQuote(tour, people) {
  const subtotal = people * (Number(tour.price_per_person) || 0)
  const serviceFee = Math.round(subtotal * SERVICE_FEE_RATE)
  return { subtotal, serviceFee, total: subtotal + serviceFee }
}

export async function fetchTours({ city, category, limit } = {}) {
  let query = supabase.from('tours').select('*').eq('status', 'active').order('created_at', { ascending: false })
  if (city) query = query.ilike('city', `%${city.trim()}%`)
  if (category) query = query.eq('category', category)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchTour(id) {
  const { data, error } = await supabase.from('tours').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null

  // The guide's public card: first name and bio only.
  const { data: guide } = await supabase.rpc('guide_profile', { p_guide_id: data.guide_id })
  return { ...data, guide: guide?.[0] ?? null }
}

export async function fetchGuideTours(guideId) {
  const { data, error } = await supabase
    .from('tours')
    .select('*')
    .eq('guide_id', guideId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function createTour(guideId, values, files) {
  const photos = await uploadPhotos(guideId, files)
  const { data, error } = await supabase
    .from('tours')
    .insert({ ...values, guide_id: guideId, photos: photos.map((p) => p.url) })
    .select('id')
    .single()

  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path))
    throw error
  }
  return data
}

// `photos` is the final ordered list: { existing: true, url } or { file }.
export async function updateTour(tour, values, photos) {
  const newFiles = photos.filter((p) => !p.existing).map((p) => p.file)
  const uploaded = newFiles.length ? await uploadPhotos(tour.guide_id, newFiles) : []

  let next = 0
  const urls = photos.map((p) => (p.existing ? p.url : uploaded[next++].url))

  const { data, error } = await supabase.from('tours').update({ ...values, photos: urls }).eq('id', tour.id).select('id')
  if (error || !data.length) {
    if (uploaded.length) await supabase.storage.from(PHOTO_BUCKET).remove(uploaded.map((p) => p.path))
    throw error ?? new Error('You can only edit your own tours.')
  }

  const removed = (tour.photos ?? []).filter((url) => !urls.includes(url)).map(photoPath).filter(Boolean)
  if (removed.length) await supabase.storage.from(PHOTO_BUCKET).remove(removed)
}

export async function updateTourStatus(id, status) {
  const { data, error } = await supabase.from('tours').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('You can only change your own tours.')
}

export async function deleteTour(tour) {
  const { data, error } = await supabase.from('tours').delete().eq('id', tour.id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('You can only delete your own tours.')

  const paths = (tour.photos ?? []).map(photoPath).filter(Boolean)
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths)
}

// ---------------------------------------------------------------- bookings

export async function fetchSpotsLeft(tourId, date) {
  const { data, error } = await supabase.rpc('tour_spots_left', { p_tour_id: tourId, p_date: date })
  if (error) throw error
  return data
}

export async function createTourBooking({ tourId, date, people }) {
  const { data, error } = await supabase.rpc('create_tour_booking', {
    p_tour_id: tourId,
    p_date: date,
    p_people: people,
  })
  if (error) throw new Error(error.message)
  return data
}

const BOOKING_FIELDS = '*, tour:tours(id, title, city, photos, start_time, meeting_point, duration_hours, category)'

export async function fetchMyTourBookings(travelerId) {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select(BOOKING_FIELDS)
    .eq('traveler_id', travelerId)
    .order('tour_date', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function fetchGuideTourBookings(guideId) {
  const { data, error } = await supabase
    .from('tour_bookings')
    .select(BOOKING_FIELDS)
    .eq('guide_id', guideId)
    .order('tour_date', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function respondToTourBooking(id, accept) {
  const { error } = await supabase.rpc('respond_tour_booking', { p_booking_id: id, p_accept: accept })
  if (error) throw new Error(error.message)
}

export async function cancelTourBooking(id) {
  const { error } = await supabase.rpc('cancel_tour_booking', { p_booking_id: id })
  if (error) throw new Error(error.message)
}
