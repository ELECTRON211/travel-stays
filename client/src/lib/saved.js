import { supabase } from './supabase'

export async function fetchSavedIds(userId) {
  const { data, error } = await supabase.from('saved_listings').select('listing_id').eq('user_id', userId)
  if (error) throw error
  return new Set((data ?? []).map((row) => row.listing_id))
}

// Saved listings, newest first. Listings that were deleted or paused are skipped.
export async function fetchSavedListings(userId) {
  const { data, error } = await supabase
    .from('saved_listings')
    .select('created_at, listing:listings(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => row.listing).filter(Boolean)
}

export async function saveListing(listingId) {
  const { error } = await supabase.from('saved_listings').insert({ listing_id: listingId })
  if (error && error.code !== '23505') throw error // 23505 = already saved
}

export async function unsaveListing(userId, listingId) {
  const { error } = await supabase.from('saved_listings').delete().eq('user_id', userId).eq('listing_id', listingId)
  if (error) throw error
}
