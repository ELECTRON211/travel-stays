import { supabase } from './supabase'

// All reads of the `listings` table go through here, so pages never build
// Supabase queries themselves.
export async function fetchListings({ city, guests, limit } = {}) {
  let query = supabase
    .from('listings')
    .select('id, title, description, city, price_per_night, max_guests, created_at')
    .order('created_at', { ascending: false })

  if (city) query = query.ilike('city', `%${city.trim()}%`)
  if (guests) query = query.gte('max_guests', Number(guests))
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
