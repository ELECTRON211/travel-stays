import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { IDLE_LIMIT_MS, IDLE_TIMEOUT_MINUTES, WARNING_MS, clearActivity, lastActivity, markActive } from '../lib/session'
import { ease } from '../lib/motion'

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

// Logs the user out after IDLE_TIMEOUT_MINUTES without activity, warning
// them during the final minute so they can stay logged in.
export default function SessionTimeout() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [secondsLeft, setSecondsLeft] = useState(null) // null = no warning showing
  const warningRef = useRef(false)
  const userId = user?.id

  useEffect(() => {
    if (!userId) return
    // Arriving from a password-reset email signs the user in without going
    // through the login form, so start their inactivity clock here.
    if (pathname === '/reset-password') markActive()

    let lastWrite = 0
    function onActivity() {
      // While the warning is up, only the "Stay logged in" button counts.
      if (warningRef.current) return
      const now = Date.now()
      if (now - lastWrite > 5000) {
        lastWrite = now
        markActive()
      }
    }

    async function logOutForInactivity() {
      clearActivity()
      warningRef.current = false
      setSecondsLeft(null)
      await signOut()
      navigate('/login', { replace: true, state: { reason: 'idle' } })
    }

    function check() {
      const idle = Date.now() - lastActivity()
      if (idle >= IDLE_LIMIT_MS) {
        logOutForInactivity()
      } else if (idle >= IDLE_LIMIT_MS - WARNING_MS) {
        warningRef.current = true
        setSecondsLeft(Math.ceil((IDLE_LIMIT_MS - idle) / 1000))
      } else if (warningRef.current) {
        // Another tab was used — hide the warning here too.
        warningRef.current = false
        setSecondsLeft(null)
      }
    }

    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity, { passive: true }))
    check() // catches a browser reopened long after the last visit
    const timer = setInterval(check, 1000)

    return () => {
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity))
      clearInterval(timer)
    }
  }, [userId, signOut, navigate, pathname])

  function stayLoggedIn() {
    markActive()
    warningRef.current = false
    setSecondsLeft(null)
  }

  function logOutNow() {
    clearActivity()
    warningRef.current = false
    setSecondsLeft(null)
    signOut()
  }

  const open = Boolean(userId) && secondsLeft !== null
  const progress = open ? secondsLeft / (WARNING_MS / 1000) : 1

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[70] grid place-items-center bg-stone-900/50 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="idle-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease }}
            className="w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl"
          >
            <div className="relative mx-auto h-20 w-20">
              <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
                <circle cx="40" cy="40" r="36" fill="none" stroke="#e7e5e4" strokeWidth="5" />
                <circle
                  cx="40"
                  cy="40"
                  r="36"
                  fill="none"
                  stroke="#065f46"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 36}
                  strokeDashoffset={2 * Math.PI * 36 * (1 - progress)}
                  className="transition-[stroke-dashoffset] duration-1000 ease-linear"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center">
                <Clock className="h-7 w-7 text-emerald-800" />
              </span>
            </div>

            <h2 id="idle-title" className="mt-6 font-display text-3xl text-stone-900">
              Still there?
            </h2>
            <p className="mt-2 text-stone-500">
              For your security, you'll be logged out in{' '}
              <span className="font-semibold tabular-nums text-stone-900">{secondsLeft}s</span> because you've been
              inactive for a while.
            </p>

            <div className="mt-8 flex gap-3">
              <button
                type="button"
                onClick={logOutNow}
                className="flex-1 rounded-full py-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:ring-stone-900"
              >
                Log out
              </button>
              <button
                type="button"
                onClick={stayLoggedIn}
                autoFocus
                className="flex-1 rounded-full bg-emerald-800 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900"
              >
                Stay logged in
              </button>
            </div>
            <p className="mt-4 text-xs text-stone-400">
              Sessions end after {IDLE_TIMEOUT_MINUTES} minutes without activity.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
