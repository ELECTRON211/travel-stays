import { useState } from 'react'
import { motion } from 'motion/react'
import { Pause, Play, ShieldCheck } from 'lucide-react'
import { images } from '../lib/images'
import { ease, fadeUp, stagger } from '../lib/motion'
import BackgroundVideo from './BackgroundVideo'
import Logo from './Logo'
import TypeWriter from './TypeWriter'

const DEFAULT_QUOTE = (
  <>
    Every host and tour guide is <em className="text-emerald-300"><TypeWriter text="verified" /></em> before they can list.
  </>
)

// The photo is shown straight away; the video (if any) loads behind it and
// fades in once it can play. Skipped for people who ask their device to
// reduce motion or to save data. A pause button keeps it accessible.
function MediaPanel({ image, video }) {
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)

  return (
    <>
      <motion.img
        key={image}
        src={image}
        alt=""
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
        transition={{ duration: 2.5, ease }}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {video && (
        <BackgroundVideo
          src={video}
          poster={image}
          paused={paused}
          minWidth={1024}
          onReady={() => setReady(true)}
          className="absolute inset-0 h-full w-full scale-105 object-cover"
        />
      )}
      {ready && (
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/30 text-white backdrop-blur-md transition hover:bg-black/50"
          aria-label={paused ? 'Play background video' : 'Pause background video'}
        >
          {paused ? <Play className="h-4 w-4" fill="currentColor" /> : <Pause className="h-4 w-4" fill="currentColor" />}
        </button>
      )}
    </>
  )
}

// Shared split-screen layout for the log in and sign up pages. Each page can
// pass its own photo and quote for the right-hand panel.
export default function AuthShell({
  title,
  subtitle,
  children,
  image = images.auth,
  video,
  quote = DEFAULT_QUOTE,
  quoteNote = 'Book stays and experiences with confidence.',
}) {
  return (
    <div className="grid min-h-screen bg-sand lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-12">
        <Logo />
        <motion.div
          variants={stagger(0.1, 0.1)}
          initial="hidden"
          animate="show"
          className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12"
        >
          <motion.h1 variants={fadeUp} className="font-display text-4xl font-medium tracking-tight text-ink sm:text-5xl">
            <TypeWriter text={title} />
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-stone-500">
            {subtitle}
          </motion.p>
          <motion.div variants={fadeUp} className="mt-10">
            {children}
          </motion.div>
        </motion.div>
      </div>

      <div className="relative hidden h-screen self-start p-3 lg:sticky lg:top-0 lg:block">
        <div className="relative h-full overflow-hidden rounded-4xl">
          <MediaPanel image={image} video={video} />
          <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/10 to-transparent" />
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.9, ease }}
            className="absolute inset-x-10 bottom-10 rounded-3xl border border-white/20 bg-white/10 p-8 text-white backdrop-blur-xl"
          >
            <ShieldCheck className="h-8 w-8 text-emerald-300" />
            <p className="mt-4 font-display text-3xl leading-snug">{quote}</p>
            <p className="mt-3 text-sm text-white/70">{quoteNote}</p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export function TextField({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <span className="mt-1.5 flex items-center gap-3 rounded-2xl bg-white px-4 ring-1 ring-black/10 transition-shadow focus-within:shadow-lg focus-within:shadow-emerald-600/10 focus-within:ring-2 focus-within:ring-emerald-500">
        <Icon className="h-5 w-5 text-stone-400" />
        <input className="w-full bg-transparent py-3.5 text-sm text-stone-900 outline-none" {...props} />
      </span>
    </label>
  )
}

export function Alert({ type = 'error', children }) {
  const styles =
    type === 'error' ? 'bg-red-50 text-red-700 ring-red-200' : 'bg-emerald-50 text-emerald-800 ring-emerald-200'
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`rounded-2xl px-4 py-3 text-sm ring-1 ${styles}`}
    >
      {children}
    </motion.div>
  )
}
