import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowRight, Compass, Home, LifeBuoy, LogIn, ShieldCheck } from 'lucide-react'
import { images, videos } from '../lib/images'
import { IDLE_TIMEOUT_MINUTES } from '../lib/session'
import { ease, fadeUp, stagger } from '../lib/motion'
import BackgroundVideo from '../components/BackgroundVideo'
import Logo from '../components/Logo'
import TypeWriter from '../components/TypeWriter'

const QUICK_LINKS = [
  { to: '/stays', label: 'Explore stays', icon: Compass },
  { to: '/signup?role=host', label: 'Become a host', icon: Home },
  { to: '/help', label: 'Help centre', icon: LifeBuoy },
]

// Where everyone lands after logging out — by choice or after being idle.
export default function LoggedOut() {
  const { state } = useLocation()
  const idle = state?.reason === 'idle'
  const [videoReady, setVideoReady] = useState(false)

  return (
    <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-stone-950 text-white">
      {/* Background: photo straight away, video fades in over it */}
      <img src={images.hero} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover" />
      <BackgroundVideo
        src={videos.showcase}
        poster={images.hero}
        onReady={() => setVideoReady(true)}
        className="absolute inset-0 -z-20 h-full w-full object-cover"
      />
      <motion.div
        initial={{ opacity: 0.9 }}
        animate={{ opacity: videoReady ? 0.75 : 0.85 }}
        transition={{ duration: 1.5 }}
        className="absolute inset-0 -z-10 bg-linear-to-b from-stone-950/70 via-stone-950/40 to-stone-950"
      />

      <header className="px-6 py-5 sm:px-10">
        <Logo light />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-8">
        <motion.div
          variants={stagger(0.1, 0.15)}
          initial="hidden"
          animate="show"
          className="w-full max-w-xl rounded-4xl bg-white/10 p-8 text-center shadow-2xl ring-1 ring-white/20 backdrop-blur-xl sm:p-10"
        >
          <motion.span
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="relative mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/20 ring-1 ring-emerald-300/40"
          >
            <motion.span
              animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute inset-0 rounded-full bg-emerald-400/30"
            />
            <ShieldCheck className="h-8 w-8 text-emerald-300" strokeWidth={1.75} />
          </motion.span>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300"
          >
            {idle ? 'Logged out for your security' : 'Signed out safely'}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="mt-3 font-display text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
          >
            Until your next <em className="text-emerald-300"><TypeWriter text="adventure." /></em>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-md leading-relaxed text-white/75">
            {idle
              ? `You were inactive for ${IDLE_TIMEOUT_MINUTES} minutes, so we logged you out to keep your account safe.`
              : "You've been logged out on this device."}{' '}
            Your trips, saved stays and bookings are safe and waiting for you.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-7 py-3.5 font-semibold text-emerald-950 shadow-lg shadow-emerald-900/40 transition hover:bg-emerald-400"
            >
              Back to home <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/10 px-7 py-3.5 font-semibold text-white ring-1 ring-white/30 transition hover:bg-white/20"
            >
              <LogIn className="h-4 w-4" /> Log in again
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 border-t border-white/15 pt-5">
            <div className="flex flex-wrap justify-center gap-2">
              {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm text-white/70 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </main>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.8, ease }}
        className="pb-6 text-center text-xs text-white/50"
      >
        Using a shared computer? Close this window to finish up.
      </motion.p>
    </div>
  )
}
