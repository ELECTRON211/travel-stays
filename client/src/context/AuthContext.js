import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)

// Any component can call useAuth() to get the logged-in user, instead of
// every page talking to Supabase Auth on its own.
export function useAuth() {
  return useContext(AuthContext)
}
