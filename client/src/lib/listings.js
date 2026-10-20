import { supabase } from './supabase'

// All reads and writes of the `listings` table (and listing photos) go
// through here, so pages never build Supabase queries themselves.

const PHOTO_BUCKET = 'listing-photos'

const LISTING_FIELDS =
  'id, host_id, title, description, city, address, property_type, bedrooms, max_guests, price_per_night, photos, status, created_at'

export async function fetchListings({ city, guests, type, limit } = {}) {
  let query = supabase
    .from('listings')
    .select(LISTING_FIELDS)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (city) query = query.ilike('city', `%${city.trim()}%`)
  if (guests) query = query.gte('max_guests', Number(guests))
  if (type) query = query.eq('property_type', type)
  if (limit) query = query.limit(limit)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function fetchListing(id) {
  const { data, error } = await supabase.from('listings').select(LISTING_FIELDS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchHostListings(hostId) {
  const { data, error } = await supabase
    .from('listings')
    .select(LISTING_FIELDS)
    .eq('host_id', hostId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data ?? []
}

// Uploads every photo to <host id>/<random id>.<ext>. If any upload fails,
// the ones that succeeded are removed so no orphan files are left behind.
async function uploadPhotos(hostId, files) {
  const bucket = supabase.storage.from(PHOTO_BUCKET)

  const results = await Promise.allSettled(
    files.map(async (file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const path = `${hostId}/${crypto.randomUUID()}.${ext}`
      const { error } = await bucket.upload(path, file, { contentType: file.type })
      if (error) throw error
      return path
    }),
  )

  const paths = results.filter((r) => r.status === 'fulfilled').map((r) => r.value)
  const failure = results.find((r) => r.status === 'rejected')

  if (failure) {
    if (paths.length) await bucket.remove(paths)
    throw new Error(`Photo upload failed: ${failure.reason.message}`)
  }

  return paths.map((path) => ({ path, url: bucket.getPublicUrl(path).data.publicUrl }))
}

function photoPath(url) {
  const marker = `/object/public/${PHOTO_BUCKET}/`
  const index = url.indexOf(marker)
  return index === -1 ? null : url.slice(index + marker.length)
}

export async function createListing(hostId, values, files) {
  const photos = await uploadPhotos(hostId, files)

  const { data, error } = await supabase
    .from('listings')
    .insert({ ...values, host_id: hostId, photos: photos.map((p) => p.url) })
    .select('id')
    .single()

  if (error) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.path))
    throw error
  }
  return data
}

// Row-level security silently skips rows the user doesn't own, so we ask for
// the changed rows back and treat "nothing changed" as an error.
export async function updateListingStatus(id, status) {
  const { data, error } = await supabase.from('listings').update({ status }).eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('You can only change your own listings.')
}

export async function deleteListing(listing) {
  const { data, error } = await supabase.from('listings').delete().eq('id', listing.id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('You can only delete your own listings.')

  const paths = (listing.photos ?? []).map(photoPath).filter(Boolean)
  if (paths.length) await supabase.storage.from(PHOTO_BUCKET).remove(paths)
}
