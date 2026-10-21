import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react'
import { ease } from '../lib/motion'
import Logo from './Logo'
import TypeWriter from './TypeWriter'

const STEPS = ['Enter email', 'Check inbox', 'New password']

function StepIndicator({ step }) {
  return (
    <ol className="flex items-center gap-2" aria-label={`Step ${step} of ${STEPS.length}`}>
      {STEPS.map((label, i) => {
        const number = i + 1
        const done = number < step
        const current = number === step
        return (
          <li key={label} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center gap-2">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold transition-colors ${
                  done || current ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-400'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : number}
              </span>
              {number < STEPS.length && (
                <span className="relative h-1 flex-1 overflow-hidden rounded-full bg-stone-100">
                  <motion.span
                    className="absolute inset-y-0 left-0 rounded-full bg-emerald-700"
                    initial={{ width: 0 }}
                    animate={{ width: done ? '100%' : '0%' }}
                    transition={{ duration: 0.6, ease }}
                  />
                </span>
              )}
            </div>
            <span className={`self-start text-[11px] font-medium ${current ? 'text-stone-900' : 'text-stone-400'}`}>
              {label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

// Layout for the "forgot password" flow: a calm, centred card with a step
// indicator, deliberately different from the photo-based log in pages.
export default function PasswordShell({ step, icon: Icon, title, subtitle, children }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-sand">
      {/* Soft background shapes */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-[32rem] w-[32rem] rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-48 -right-32 h-[30rem] w-[30rem] rounded-full bg-amber-100/60 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(120 113 108 / 0.25) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
      />

      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 sm:px-8">
        <header className="flex items-center justify-between">
          <Logo />
          <Link
            to="/login"
            className="group flex items-center gap-1.5 text-sm font-semibold text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back to log in
          </Link>
        </header>

        <main className="flex flex-1 items-center justify-center py-10">
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease }}
            className="relative w-full max-w-md rounded-[2rem] bg-white/90 p-8 pt-14 shadow-2xl shadow-stone-900/10 ring-1 ring-stone-900/5 backdrop-blur-md sm:p-10 sm:pt-16"
          >
            {/* Floating icon badge. The outer div positions it; the inner one
                animates, so the animation can't override the centring. */}
            <div className="absolute inset-x-0 -top-9 flex justify-center">
              <motion.span
                key={step}
                initial={{ scale: 0.5, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.15 }}
                className="grid h-18 w-18 place-items-center rounded-2xl bg-linear-to-br from-emerald-600 to-emerald-900 text-white shadow-xl shadow-emerald-900/30 ring-8 ring-sand"
              >
                <motion.span animate={{ y: [0, -3, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
                  <Icon className="h-8 w-8" strokeWidth={1.75} />
                </motion.span>
              </motion.span>
            </div>

            <StepIndicator step={step} />

            <h1 className="mt-8 text-center font-display text-3xl font-medium tracking-tight text-stone-900 sm:text-4xl">
              {typeof title === 'string' ? <TypeWriter text={title} /> : title}
            </h1>
            {subtitle && <p className="mt-2 text-center text-stone-500">{subtitle}</p>}

            <div className="mt-8">{children}</div>
          </motion.div>
        </main>

        <footer className="flex items-center justify-center gap-2 pb-2 text-xs text-stone-500">
          <ShieldCheck className="h-4 w-4 text-emerald-700" />
          Reset links are private, single-use and expire after 1 hour.
        </footer>
      </div>
    </div>
  )
}
