import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CircleAlert, CircleCheck, Heart, Info, LogOut, X } from 'lucide-react'
import { ToastContext } from './ToastContext'

const STYLES = {
  success: { icon: CircleCheck, tone: 'bg-emerald-100 text-emerald-800', bar: 'bg-emerald-600' },
  saved: { icon: Heart, tone: 'bg-rose-100 text-rose-600', bar: 'bg-rose-500', fill: true },
  info: { icon: Info, tone: 'bg-stone-100 text-stone-700', bar: 'bg-stone-500' },
  logout: { icon: LogOut, tone: 'bg-stone-100 text-stone-700', bar: 'bg-stone-500' },
  error: { icon: CircleAlert, tone: 'bg-red-100 text-red-700', bar: 'bg-red-500' },
}

function Toast({ toast, onDismiss }) {
  const style = STYLES[toast.type] ?? STYLES.success
  const Icon = style.icon

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), toast.duration)
    return () => clearTimeout(timer)
  }, [toast.id, toast.duration, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 60, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="pointer-events-auto relative w-full overflow-hidden rounded-2xl bg-white shadow-2xl shadow-stone-900/15 ring-1 ring-stone-900/5 sm:w-96"
      role="status"
    >
      <div className="flex items-start gap-3 p-4 pr-10">
        <motion.span
          initial={{ scale: 0.4, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.05 }}
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${style.tone}`}
        >
          <Icon className={`h-[18px] w-[18px] ${style.fill ? 'fill-current' : ''}`} />
        </motion.span>
        <div className="min-w-0 pt-0.5">
          <p className="font-semibold text-stone-900">{toast.title}</p>
          {toast.description && <p className="mt-0.5 text-sm text-stone-500">{toast.description}</p>}
          {toast.action && (
            <Link
              to={toast.action.to}
              onClick={() => onDismiss(toast.id)}
              className="mt-2 inline-block text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
            >
              {toast.action.label} →
            </Link>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="absolute right-2.5 top-2.5 grid h-7 w-7 place-items-center rounded-full text-stone-400 transition hover:bg-stone-100 hover:text-stone-700"
        aria-label="Dismiss notification"
      >
        <X className="h-4 w-4" />
      </button>
      {/* Shrinking bar showing how long until the toast closes itself */}
      <motion.div
        className={`absolute bottom-0 left-0 h-1 ${style.bar}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: toast.duration / 1000, ease: 'linear' }}
      />
    </motion.div>
  )
}

// Small pop-up notifications ("toasts") in the corner of the screen.
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const show = useCallback(({ title, description, type = 'success', action, duration = 4000 }) => {
    const id = crypto.randomUUID()
    // Keep at most three on screen.
    setToasts((current) => [...current.slice(-2), { id, title, description, type, action, duration }])
    return id
  }, [])

  const value = useMemo(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-80 flex flex-col items-center gap-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}
