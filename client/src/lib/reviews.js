import { supabase } from './supabase'

export async function fetchListingReviews(listingId) {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

// { [bookingId]: review } for the given bookings. Returns {} if reviews
// can't be loaded, so trip pages still work without them.
export async function fetchReviewsForBookings(bookingIds) {
  if (!bookingIds.length) return {}
  const { data, error } = await supabase.from('reviews').select('*').in('booking_id', bookingIds)
  if (error) {
    console.warn('Could not load reviews:', error.message)
    return {}
  }
  return Object.fromEntries((data ?? []).map((review) => [review.booking_id, review]))
}

export async function submitReview(bookingId, rating, comment) {
  const { error } = await supabase.rpc('submit_review', {
    p_booking_id: bookingId,
    p_rating: rating,
    p_comment: comment,
  })
  if (error) throw new Error(error.message)
}

export async function replyToReview(reviewId, reply) {
  const { error } = await supabase.rpc('reply_to_review', { p_review_id: reviewId, p_reply: reply })
  if (error) throw new Error(error.message)
}
