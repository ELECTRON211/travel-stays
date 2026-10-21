import { supabase } from './supabase'
import { nightsBetween } from './dates'

// Must match the service fee in create_booking (supabase/migrations/003_bookings.sql).
// The server always recalculates the price; this is only for showing it.
export const SERVICE_FEE_RATE = 0.1

export function quote(listing, checkIn, checkOut) {
  if (!checkIn || !checkOut) return null
  const nights = nightsBetween(checkIn, checkOut)
  const rate = Number(listing.price_per_night) || 0
  const cleaningFee = Number(listing.cleaning_fee) || 0
  const subtotal = nights * rate
  const serviceFee = Math.round((subtotal + cleaningFee) * SERVICE_FEE_RATE)
  return { nights, rate, subtotal, cleaningFee, serviceFee, total: subtotal + cleaningFee + serviceFee }
}

// Nights already taken on a listing, as [{ check_in, check_out }].
export async function fetchBookedRanges(listingId) {
  const { data, error } = await supabase.rpc('listing_booked_ranges', { p_listing_id: listingId })
  if (error) throw error
  return data ?? []
}

export async function createBooking({ listingId, checkIn, checkOut, guests }) {
  const { data, error } = await supabase.rpc('create_booking', {
    p_listing_id: listingId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_guests: guests,
  })
  if (error) throw new Error(error.message)
  return data
}

export async function fetchBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, listing:listings(id, title, city, photos, property_type, booking_mode)')
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data
}
