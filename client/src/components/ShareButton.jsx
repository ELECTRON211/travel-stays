import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react'
import { ease } from '../lib/motion'

// Uses the phone's own share sheet when there is one; otherwise offers
// "Copy link" and WhatsApp.
export default function ShareButton({ title }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const url = `${window.location.origin}${window.location.pathname}`

  async function handleClick() {
    if (navigator.share) {
      try {
        await navigator.share({ title, url })
      } catch {
        // The visitor closed the share sheet — nothing to do.
      }
      return
    }
    setOpen(!open)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', url)
    }
  }

  const itemClass = 'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-stone-700 transition-colors hover:bg-stone-50'

  return (
    <div className="relative">
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-900"
      >
        <Share2 className="h-4 w-4" /> Share
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15, ease }}
              className="absolute right-0 z-20 mt-2 w-52 origin-top-right overflow-hidden rounded-xl bg-white py-1.5 shadow-2xl shadow-stone-900/15 ring-1 ring-stone-900/5"
            >
              <button type="button" onClick={copyLink} className={itemClass}>
                {copied ? <Check className="h-4 w-4 text-emerald-700" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Link copied!' : 'Copy link'}
              </button>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${title} — ${url}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className={itemClass}
              >
                <MessageCircle className="h-4 w-4 text-emerald-600" /> Share on WhatsApp
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
