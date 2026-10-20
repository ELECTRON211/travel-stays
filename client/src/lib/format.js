const naira = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
})

// Returns "₦45,000", or a dash if the price is missing, so a listing without
// a price can never crash the page.
export function formatNaira(amount) {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) return '—'
  return naira.format(Number(amount))
}

export function initials(name) {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')
}
