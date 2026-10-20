import { ShieldCheck } from 'lucide-react'
import Logo from './Logo'

// Shared two-column layout for the log in and sign up pages.
export default function AuthShell({ title, subtitle, children }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-4 py-8 sm:px-12">
        <Logo />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
          <p className="mt-2 text-gray-500">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>

      <div className="relative hidden overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-500 lg:flex lg:items-end">
        <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="relative m-12 max-w-md rounded-2xl bg-white/10 p-8 text-white backdrop-blur">
          <ShieldCheck className="h-8 w-8" />
          <p className="mt-4 text-xl font-semibold leading-snug">
            Every host and tour guide on Travel &amp; Stays is verified before they can list.
          </p>
          <p className="mt-3 text-sm text-emerald-50/80">Book stays and experiences with confidence.</p>
        </div>
      </div>
    </div>
  )
}

export function TextField({ icon: Icon, label, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <span className="mt-1.5 flex items-center gap-2 rounded-xl border border-gray-300 px-3 focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-500/20">
        <Icon className="h-5 w-5 text-gray-400" />
        <input className="w-full bg-transparent py-3 text-sm text-gray-900 outline-none" {...props} />
      </span>
    </label>
  )
}

export function Alert({ type = 'error', children }) {
  const styles =
    type === 'error'
      ? 'border-red-200 bg-red-50 text-red-700'
      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
  return <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
}
