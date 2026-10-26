import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, ExternalLink, Flag, Loader2, Pause, ShieldCheck, X } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import {
  documentUrl,
  fetchOpenReports,
  fetchPendingVerifications,
  idTypeLabel,
  reportCategoryLabel,
  resolveReport,
  reviewVerification,
} from '../lib/safety'

function timeAgo(value) {
  const hours = Math.round((Date.now() - new Date(value).getTime()) / 3600000)
  if (hours < 1) return 'just now'
  if (hours < 24) return `${hours} h ago`
  return `${Math.round(hours / 24)} d ago`
}

function DocButton({ path, label }) {
  const toast = useToast()
  const [opening, setOpening] = useState(false)

  async function open() {
    setOpening(true)
    try {
      window.open(await documentUrl(path), '_blank', 'noopener')
    } catch (err) {
      toast.show({ type: 'error', title: 'Could not open document', description: err.message })
    }
    setOpening(false)
  }

  return (
    <button
      type="button"
      onClick={open}
      className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-stone-300 hover:ring-stone-900"
    >
      {opening ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ExternalLink className="h-3.5 w-3.5" />} {label}
    </button>
  )
}

// Admin dashboard: ID verification queue + open reports.
export default function AdminTrust({ onChange }) {
  const toast = useToast()
  const verifications = useAsync(fetchPendingVerifications, 'verifications')
  const reports = useAsync(fetchOpenReports, 'reports')
  const [busy, setBusy] = useState(null)

  async function run(id, action, success) {
    setBusy(id)
    try {
      await action()
      toast.show(success)
      verifications.reload()
      reports.reload()
      onChange?.()
    } catch (err) {
      toast.show({ type: 'error', title: 'Something went wrong', description: err.message })
    }
    setBusy(null)
  }

  function review(v, approve) {
    let reason = null
    if (!approve) {
      reason = window.prompt('Why is this being rejected? (shown to the user)', 'The photo is not clear enough.')
      if (reason === null) return
    }
    run(v.id, () => reviewVerification(v.id, approve, reason), {
      title: approve ? `${v.full_name || 'User'} is now verified` : 'Request rejected',
      description: approve ? 'The Verified badge now shows on their listings and tours.' : 'They can send new documents.',
    })
  }

  function resolve(r, pause) {
    run(r.id, () => resolveReport(r.id, pause), {
      title: pause ? `${r.target_type === 'tour' ? 'Tour' : 'Listing'} paused` : 'Report dismissed',
      description: pause ? 'It is hidden from search until the owner fixes it.' : r.target_title,
    })
  }

  const pending = verifications.data ?? []
  const open = reports.data ?? []

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-stone-900">
            <ShieldCheck className="h-5 w-5 text-emerald-700" /> ID verification
          </h2>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{pending.length} waiting</span>
        </div>
        <p className="text-sm text-stone-500">Check the ID matches the selfie and the account name.</p>
        {verifications.error && <p className="mt-4 text-sm text-red-700">{verifications.error}</p>}
        <ul className="mt-4 space-y-3">
          {pending.map((v) => (
            <li key={v.id} className="rounded-xl bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-stone-900">
                    {v.full_name || 'No name'} <span className="text-xs font-semibold capitalize text-stone-500">· {v.role}</span>
                  </p>
                  <p className="text-xs text-stone-500">
                    {v.email} · {idTypeLabel(v.id_type)} · {timeAgo(v.created_at)}
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <DocButton path={v.id_doc_path} label="ID" />
                  <DocButton path={v.selfie_path} label="Selfie" />
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy === v.id}
                  onClick={() => review(v, false)}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject
                </button>
                <button
                  disabled={busy === v.id}
                  onClick={() => review(v, true)}
                  className="flex items-center gap-1 rounded-full bg-emerald-800 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-50"
                >
                  <Check className="h-4 w-4" /> Approve
                </button>
              </div>
            </li>
          ))}
          {!verifications.loading && !pending.length && <li className="text-sm text-stone-500">Nothing to review.</li>}
        </ul>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-stone-900">
            <Flag className="h-5 w-5 text-red-600" /> Reports
          </h2>
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">{open.length} open</span>
        </div>
        <p className="text-sm text-stone-500">Pause anything unsafe; it leaves search straight away.</p>
        {reports.error && <p className="mt-4 text-sm text-red-700">{reports.error}</p>}
        <ul className="mt-4 space-y-3">
          {open.map((r) => (
            <li key={r.id} className="rounded-xl bg-stone-50 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  {r.target_type === 'guest' ? (
                    <p className="font-medium text-stone-900">{r.target_title}</p>
                  ) : (
                    <Link
                      to={`/${r.target_type === 'tour' ? 'tours' : 'listings'}/${r.target_id}`}
                      className="font-medium text-stone-900 hover:underline"
                    >
                      {r.target_title}
                    </Link>
                  )}
                  <p className="text-xs text-stone-500">
                    {r.target_type === 'guest'
                      ? 'Guest'
                      : `${r.target_type === 'tour' ? 'Tour' : 'Listing'} by ${r.owner_name || 'unknown'}`}{' '}
                    · reported by {r.reporter_name || 'a user'} · {timeAgo(r.created_at)}
                  </p>
                </div>
                <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">{reportCategoryLabel(r.category)}</span>
              </div>
              {r.details && <p className="mt-2 whitespace-pre-line text-sm text-stone-700">"{r.details}"</p>}
              <div className="mt-3 flex gap-2">
                <button
                  disabled={busy === r.id}
                  onClick={() => resolve(r, false)}
                  className="rounded-full px-3 py-1.5 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900 disabled:opacity-50"
                >
                  Dismiss
                </button>
                {r.target_status === 'active' && (
                  <button
                    disabled={busy === r.id}
                    onClick={() => resolve(r, true)}
                    className="flex items-center gap-1 rounded-full bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    <Pause className="h-4 w-4" /> Pause {r.target_type}
                  </button>
                )}
              </div>
            </li>
          ))}
          {!reports.loading && !open.length && <li className="text-sm text-stone-500">No open reports.</li>}
        </ul>
      </section>
    </div>
  )
}
