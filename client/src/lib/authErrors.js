// Turns Supabase Auth errors into messages people understand. `wait` (seconds)
// is set for rate limits, so the form can count down before the next try.

const MESSAGES = {
  over_email_send_rate_limit: {
    message: 'We’ve sent a lot of emails in the last hour, so we’re pausing for a moment. Please try again in a few minutes.',
    wait: 120,
  },
  over_request_rate_limit: {
    message: 'Too many attempts in a short time. Please wait a minute and try again.',
    wait: 60,
  },
  over_sms_send_rate_limit: {
    message: 'Too many codes sent. Please wait a few minutes and try again.',
    wait: 120,
  },
  invalid_credentials: { message: 'That email and password don’t match. Check them and try again.' },
  email_not_confirmed: { message: 'Please confirm your email first — open the link we sent to your inbox.' },
  user_already_exists: { message: 'An account with this email already exists. Try logging in instead.' },
  email_exists: { message: 'An account with this email already exists. Try logging in instead.' },
  weak_password: { message: 'Please choose a stronger password — at least 6 characters.' },
  email_address_invalid: { message: 'That email address doesn’t look right. Please check it.' },
  same_password: { message: 'Your new password must be different from your old one.' },
  session_not_found: { message: 'Your session has expired. Please log in again.' },
  signup_disabled: { message: 'New sign-ups are paused right now. Please try again later.' },
}

export function friendlyAuthError(error) {
  if (!error) return { message: '' }
  const text = String(error.message ?? error).toLowerCase()

  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code]

  // Older servers send no code — match on the status and text instead.
  if (text.includes('email rate limit')) return MESSAGES.over_email_send_rate_limit
  if (error.status === 429 || text.includes('rate limit') || text.includes('too many')) {
    return MESSAGES.over_request_rate_limit
  }
  if (text.includes('invalid login credentials')) return MESSAGES.invalid_credentials
  if (text.includes('email not confirmed')) return MESSAGES.email_not_confirmed
  if (text.includes('already registered') || text.includes('already been registered')) return MESSAGES.user_already_exists
  if (text.includes('password should be')) return MESSAGES.weak_password
  if (text.includes('failed to fetch') || text.includes('network')) {
    return { message: 'We can’t reach the server. Check your internet connection and try again.' }
  }

  return { message: error.message || 'Something went wrong. Please try again.' }
}
