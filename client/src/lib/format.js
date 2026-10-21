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

// "afolabi@gmail.com" → "af•••••@gmail.com"
export function maskEmail(email) {
  if (!email || !email.includes('@')) return email || ''
  const [name, domain] = email.split('@')
  return `${name.slice(0, 2)}${'•'.repeat(Math.max(name.length - 2, 3))}@${domain}`
}

// "+234 801 234 5678" → "••••••••5678"
export function maskPhone(phone) {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  return `${'•'.repeat(Math.max(digits.length - 4, 4))}${digits.slice(-4)}`
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
