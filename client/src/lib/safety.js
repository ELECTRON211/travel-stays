import { supabase } from './supabase'

// Trust & safety: ID verification and reports (supabase/migrations/012).

const DOCS_BUCKET = 'verification-docs' // private — files are only reachable through short-lived signed links

export const ID_TYPES = [
  { value: 'nin', label: 'NIN slip / card' },
  { value: 'drivers_licence', label: "Driver's licence" },
  { value: 'passport', label: 'International passport' },
  { value: 'voters_card', label: "Voter's card" },
]

export const REPORT_CATEGORIES = [
  { value: 'fraud', label: 'Scam or fraud', text: 'Asked to pay outside the app, fake payment details' },
  { value: 'unsafe', label: 'Safety concern', text: 'Threatening behaviour, the place or tour feels unsafe' },
  { value: 'fake', label: 'Fake or misleading', text: "Photos or details don't match reality" },
  { value: 'inappropriate', label: 'Inappropriate content', text: 'Offensive text or images' },
  { value: 'other', label: 'Something else', text: 'Tell us what happened' },
]

// Reasons a host or guide can report a guest.
export const GUEST_REPORT_CATEGORIES = [
  { value: 'unsafe', label: 'Threatening or unsafe', text: 'Aggressive, threatening or violent behaviour' },
  { value: 'damage', label: 'Damage or theft', text: 'Broke or took things from the property' },
  { value: 'rules', label: 'Broke the house rules', text: 'Parties, extra guests, smoking where not allowed' },
  { value: 'fraud', label: 'Scam or fraud', text: 'Fake payment, asked for money outside the app' },
  { value: 'other', label: 'Something else', text: 'Tell us what happened' },
]

export function idTypeLabel(value) {
  return ID_TYPES.find((t) => t.value === value)?.label ?? value
}

export function reportCategoryLabel(value) {
  return [...REPORT_CATEGORIES, ...GUEST_REPORT_CATEGORIES].find((c) => c.value === value)?.label ?? value
}

// Permanently deletes the logged-in user's account (refused while they have
// stays or tours coming up). See delete_my_account() in migration 013.
export async function deleteMyAccount() {
  const { error } = await supabase.rpc('delete_my_account')
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------- verification

// The user's latest request (or null).
export async function fetchMyVerification(userId) {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('id, id_type, status, reason, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

async function uploadDoc(userId, file, name) {
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const path = `${userId}/${name}-${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw new Error(`Upload failed: ${error.message}`)
  return path
}

export async function submitVerification(userId, { idType, idFile, selfieFile }) {
  const idPath = await uploadDoc(userId, idFile, 'id')
  const selfiePath = await uploadDoc(userId, selfieFile, 'selfie')

  const { error } = await supabase.rpc('submit_verification', {
    p_id_type: idType,
    p_id_doc_path: idPath,
    p_selfie_path: selfiePath,
  })
  if (error) {
    await supabase.storage.from(DOCS_BUCKET).remove([idPath, selfiePath])
    throw new Error(error.message)
  }
}

// ---------------------------------------------------------------- reports

export async function submitReport({ targetType, targetId, category, details }) {
  const { error } = await supabase.rpc('submit_report', {
    p_target_type: targetType,
    p_target_id: targetId,
    p_category: category,
    p_details: details,
  })
  if (error) throw new Error(error.message)
}

// ---------------------------------------------------------------- admin

export async function fetchPendingVerifications() {
  const { data, error } = await supabase.rpc('admin_verifications')
  if (error) throw new Error(error.message)
  return data ?? []
}

// A link to a private document that works for 10 minutes.
export async function documentUrl(path) {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 600)
  if (error) throw new Error(error.message)
  return data.signedUrl
}

export async function reviewVerification(id, approve, reason) {
  const { error } = await supabase.rpc('review_verification', {
    p_request_id: id,
    p_approve: approve,
    p_reason: reason ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function fetchOpenReports() {
  const { data, error } = await supabase.rpc('admin_reports')
  if (error) throw new Error(error.message)
  return data ?? []
}

// ---------------------------------------------------------------- contact form (migration 014)

export const CONTACT_SUBJECTS = [
  { value: 'booking', label: 'A booking' },
  { value: 'payment', label: 'A payment' },
  { value: 'account', label: 'My account' },
  { value: 'safety', label: 'A safety concern' },
  { value: 'hosting', label: 'Hosting or guiding' },
  { value: 'other', label: 'Something else' },
]

export async function sendContactMessage({ name, email, subject, message, bookingRef }) {
  const { error } = await supabase.rpc('submit_contact_message', {
    p_name: name,
    p_email: email,
    p_subject: subject,
    p_message: message,
    p_booking_ref: bookingRef || null,
  })
  if (error) throw new Error(error.message)
}

export async function fetchContactMessages() {
  const { data, error } = await supabase.rpc('admin_contact_messages')
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function markMessageHandled(id) {
  const { error } = await supabase.rpc('resolve_contact_message', { p_message_id: id })
  if (error) throw new Error(error.message)
}

export async function resolveReport(id, pause) {
  const { error } = await supabase.rpc('resolve_report', { p_report_id: id, p_pause: pause })
  if (error) throw new Error(error.message)
}
