// Automatic logout after a period of inactivity.
// The last-activity time is kept in localStorage so every open tab shares it:
// activity in any tab keeps the user logged in everywhere.

export const IDLE_TIMEOUT_MINUTES = 30
export const IDLE_LIMIT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000
export const WARNING_MS = 60 * 1000 // show "Still there?" for the last minute

const KEY = 'travel-stays:last-activity'
let memoryFallback = Date.now() // used when storage is blocked (e.g. private mode)

export function markActive() {
  memoryFallback = Date.now()
  try {
    localStorage.setItem(KEY, String(memoryFallback))
  } catch {
    // Storage unavailable — the in-memory value still works for this tab.
  }
}

export function lastActivity() {
  try {
    return Number(localStorage.getItem(KEY)) || memoryFallback
  } catch {
    return memoryFallback
  }
}

// Supabase keeps the login (access + refresh tokens) in localStorage under
// keys like "sb-<project>-auth-token". Used as a fallback on logout in case
// supabase.auth.signOut() can't finish, so no token is ever left behind.
export function clearStoredAuth() {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith('sb-') && key.includes('-auth-token'))
      .forEach((key) => localStorage.removeItem(key))
  } catch {
    // Storage unavailable — nothing was stored there in the first place.
  }
}

export function clearActivity() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
