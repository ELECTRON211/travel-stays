import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { Heart } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useSaved } from '../context/SavedContext'
import { useToast } from '../context/ToastContext'

// Heart button for the wishlist. `overlay` sits on a photo; `pill` is a
// labelled button for the listing page. Logged-out visitors go to log in.
export default function SaveButton({ listingId, variant = 'overlay', className = '' }) {
  const { user } = useAuth()
  const { isSaved, toggle } = useSaved()
  const toast = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const saved = isSaved(listingId)

  async function handleClick(e) {
    e.preventDefault() // the button often sits inside a card link
    e.stopPropagation()
    if (!user) {
      navigate('/login', { state: { from: location.pathname + location.search } })
      return
    }
    try {
      await toggle(listingId)
      toast.show(
        saved
          ? { type: 'info', title: 'Removed from saved', description: 'This stay is no longer on your wishlist.' }
          : {
              type: 'saved',
              title: 'Saved to your wishlist',
              description: "We'll keep it here for when you're ready to book.",
              action: { label: 'View saved stays', to: '/saved' },
            },
      )
    } catch (error) {
      toast.show({ type: 'error', title: "Couldn't update your wishlist", description: error.message })
    }
  }

  const heart = (
    <motion.span
      key={saved ? 'saved' : 'unsaved'}
      initial={{ scale: saved ? 0.6 : 1 }}
      animate={{ scale: saved ? [0.6, 1.3, 1] : 1 }}
      transition={{ duration: 0.4 }}
      className="grid place-items-center"
    >
      <Heart
        className={`h-[18px] w-[18px] transition-colors ${saved ? 'fill-rose-500 text-rose-500' : variant === 'overlay' ? 'text-stone-800' : 'text-stone-700'}`}
      />
    </motion.span>
  )

  if (variant === 'pill') {
    return (
      <motion.button
        type="button"
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        aria-pressed={saved}
        className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-stone-900 ring-1 ring-stone-300 transition hover:ring-stone-900 ${className}`}
      >
        {heart}
        {saved ? 'Saved' : 'Save'}
      </motion.button>
    )
  }

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.85 }}
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? 'Remove from saved' : 'Save to wishlist'}
      className={`grid h-9 w-9 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur-md transition hover:bg-white ${className}`}
    >
      {heart}
    </motion.button>
  )
}
