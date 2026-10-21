import { supabase } from './supabase'

export async function updateProfile(userId, { fullName, phone, bio }) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, phone: phone || null, bio: bio || null })
    .eq('id', userId)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data.length) throw new Error('Your profile could not be saved. Please try again.')

  // Keep the name on the auth account in sync, so it shows even if the
  // profile row can't be read for a moment.
  await supabase.auth.updateUser({ data: { full_name: fullName } })
}

export async function changePassword(password) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw new Error(error.message)
}
