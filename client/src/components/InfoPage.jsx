import { motion } from 'motion/react'
import { fadeUp, stagger } from '../lib/motion'
import Reveal from './Reveal'

export const SUPPORT_EMAIL = 'afolabiprosper329@gmail.com'

// Shared layout for Help, Terms and Privacy.
export default function InfoPage({ eyebrow, title, accent, intro, updated, children }) {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-20 pt-8 sm:px-6">
      <motion.header variants={stagger(0.08)} initial="hidden" animate="show">
        <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
          {eyebrow}
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-2 font-display text-5xl font-medium tracking-tight text-stone-900 sm:text-6xl"
        >
          {title} {accent && <em className="text-emerald-800">{accent}</em>}
        </motion.h1>
        {intro && (
          <motion.p variants={fadeUp} className="mt-4 text-lg leading-relaxed text-stone-600">
            {intro}
          </motion.p>
        )}
        {updated && (
          <motion.p variants={fadeUp} className="mt-3 text-sm text-stone-400">
            Last updated {updated}
          </motion.p>
        )}
      </motion.header>
      <div className="mt-12 space-y-12">{children}</div>
    </div>
  )
}

export function InfoSection({ id, title, children }) {
  return (
    <Reveal>
      <section id={id} className="scroll-mt-28">
        <h2 className="font-display text-2xl tracking-tight text-stone-900">{title}</h2>
        <div className="mt-4 space-y-3 leading-relaxed text-stone-600 [&_a]:font-medium [&_a]:text-emerald-800 [&_a]:underline [&_a]:underline-offset-4 [&_li]:ml-5 [&_li]:list-disc [&_strong]:text-stone-900">
          {children}
        </div>
      </section>
    </Reveal>
  )
}
