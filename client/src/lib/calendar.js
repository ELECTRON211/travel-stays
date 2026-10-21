import { supabase } from './supabase'

// Everything the host calendar shows for one listing: its bookings (with the
// guest's name) and the date ranges the host has blocked.
export async function fetchListingCalendar(listingId) {
  const [bookingsResult, blocksResult] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, traveler_id, check_in, check_out, guests, status, payment_status')
      .eq('listing_id', listingId)
      .in('status', ['pending', 'confirmed', 'completed']),
    supabase.from('listing_blocks').select('*').eq('listing_id', listingId).order('start_date'),
  ])
  if (bookingsResult.error) throw bookingsResult.error
  if (blocksResult.error) throw blocksResult.error

  const bookings = bookingsResult.data ?? []
  const guestIds = [...new Set(bookings.map((b) => b.traveler_id))]
  let names = {}
  if (guestIds.length) {
    const { data: profiles } = await supabase.from('profiles').select('id, full_name').in('id', guestIds)
    names = Object.fromEntries((profiles ?? []).map((p) => [p.id, p.full_name]))
  }

  return {
    bookings: bookings.map((b) => ({ ...b, guest_name: names[b.traveler_id] || 'Guest' })),
    blocks: blocksResult.data ?? [],
  }
}

// `endDate` is the first night that is free again (exclusive), like check-out.
export async function blockDates(listingId, startDate, endDate, note) {
  const { error } = await supabase
    .from('listing_blocks')
    .insert({ listing_id: listingId, start_date: startDate, end_date: endDate, note: note || null })
  if (error) throw new Error(error.message)
}

export async function unblockDates(blockId) {
  const { error } = await supabase.from('listing_blocks').delete().eq('id', blockId)
  if (error) throw new Error(error.message)
}
