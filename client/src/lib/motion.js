// Shared animation settings so every page moves the same way.
export const ease = [0.22, 1, 0.36, 1]

export const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease } },
}

export function stagger(gap = 0.08, delay = 0) {
  return { hidden: {}, show: { transition: { staggerChildren: gap, delayChildren: delay } } }
}
