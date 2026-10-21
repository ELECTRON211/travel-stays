import PaystackPop from '@paystack/inline-js'
import { supabase } from './supabase'

const PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY

// 1. Ask the database to create a payment for this booking. The amount comes
//    from the booking on the server, never from the browser.
async function startPayment(bookingId) {
  const { data, error } = await supabase.rpc('start_payment', { p_booking_id: bookingId })
  if (error) throw new Error(error.message)
  return data[0] // { reference, amount, email }
}

// 2. Open the Paystack popup. Resolves when the customer pays, rejects with
//    `cancelled: true` if they close it.
function openPaystack({ reference, amount, email, bookingId }) {
  return new Promise((resolve, reject) => {
    const popup = new PaystackPop()
    popup.newTransaction({
      key: PUBLIC_KEY,
      email,
      amount, // kobo
      currency: 'NGN',
      reference,
      metadata: { booking_id: bookingId },
      onSuccess: (transaction) => resolve(transaction),
      onCancel: () => reject(Object.assign(new Error('Payment cancelled.'), { cancelled: true })),
      onError: (error) => reject(new Error(error?.message || 'Paystack could not start the payment.')),
    })
  })
}

// 3. Ask our server to confirm the payment with Paystack before marking the
//    booking as paid.
async function verifyPayment(reference) {
  const { data, error } = await supabase.functions.invoke('verify-payment', { body: { reference } })
  if (error) {
    // The function's own error message, if it sent one.
    const message = await error.context?.json?.().then((b) => b.error).catch(() => null)
    throw new Error(message || error.message)
  }
  if (data?.status !== 'success') throw new Error(data?.error || 'Payment could not be confirmed.')
}

export async function payForBooking(bookingId, { onVerifying } = {}) {
  if (!PUBLIC_KEY) throw new Error('Payments are not set up yet (missing VITE_PAYSTACK_PUBLIC_KEY).')
  const payment = await startPayment(bookingId)
  await openPaystack({ ...payment, bookingId })
  onVerifying?.()
  await verifyPayment(payment.reference)
}
