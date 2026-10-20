import { motion } from 'motion/react'
import { ease } from '../lib/motion'

// Fades its children up into place the first time they scroll into view.
export default function Reveal({ children, className = '', delay = 0, y = 32 }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -80px 0px' }}
      transition={{ duration: 0.8, ease, delay }}
    >
      {children}
    </motion.div>
  )
}
