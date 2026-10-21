import { useState } from 'react'
import { motion } from 'motion/react'
import { CreditCard, Loader2, Lock } from 'lucide-react'
import { payForBooking } from '../lib/payments'
import { formatNaira } from '../lib/format'
import { Alert } from './AuthShell'

// "Pay ₦X now" for a confirmed, unpaid booking. `onPaid` runs after the
// server has confirmed the payment with Paystack.
export default function PayButton({ booking, onPaid }) {
  const [stage, setStage] = useState('idle') // idle | paying | verifying
  const [error, setError] = useState('')

  async function handlePay() {
    setError('')
    setStage('paying')
    try {
      await payForBooking(booking.id, { onVerifying: () => setStage('verifying') })
      onPaid()
    } catch (err) {
      if (!err.cancelled) setError(err.message)
    } finally {
      setStage('idle')
    }
  }

  const busy = stage !== 'idle'

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      <motion.button
        type="button"
        whileHover={{ scale: busy ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={handlePay}
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-emerald-800 py-4 font-semibold text-white shadow-lg shadow-emerald-900/20 transition-colors hover:bg-emerald-900 disabled:opacity-70"
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
        {stage === 'verifying'
          ? 'Confirming your payment…'
          : stage === 'paying'
            ? 'Opening secure checkout…'
            : `Pay ${formatNaira(booking.total)} now`}
      </motion.button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-stone-500">
        <Lock className="h-3.5 w-3.5" /> Secured by Paystack · card, bank transfer or USSD
      </p>
    </div>
  )
}
