import { createContext, useContext } from 'react'

export const ToastContext = createContext(null)

// useToast().show({ title, description?, type?, action?: { label, to } })
// type: 'success' | 'error' | 'info' | 'saved' | 'logout'
export function useToast() {
  return useContext(ToastContext)
}
