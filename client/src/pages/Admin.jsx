import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import {
  Activity,
  BedDouble,
  CalendarCheck,
  Coins,
  RefreshCw,
  Search,
  Star,
  UserPlus,
  Users,
  Wallet,
} from 'lucide-react'
import { usePresence } from '../context/PresenceContext'
import { useAsync } from '../hooks/useAsync'
import { fetchAdminStats, fetchAdminUsers } from '../lib/admin'
import { formatNaira, initials } from '../lib/format'
import { fadeUp, stagger } from '../lib/motion'
import { Alert } from '../components/AuthShell'
import TypeWriter from '../components/TypeWriter'

const ROLE_STYLES = {
  traveler: 'bg-sky-50 text-sky-800',
  host: 'bg-emerald-50 text-emerald-800',
  guide: 'bg-amber-50 text-amber-800',
  admin: 'bg-stone-900 text-white',
}
const ROLE_FILTERS = ['all', 'traveler', 'host', 'guide', 'admin']

// "just now", "5 min ago", "3 h ago", "2 days ago"
function timeAgo(value) {
  if (!value) return 'Never'
  const minutes = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  return `${days} ${days === 1 ? 'day' : 'days'} ago`
}

function StatCard({ icon: Icon, label, value, note, accent = 'text-emerald-800 bg-emerald-50' }) {
  return (
    <motion.div variants={fadeUp} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-stone-900/5">
      <span className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}>
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-stone-400">{label}</p>
      <p className="mt-1 font-display text-3xl text-stone-900">{value}</p>
      {note && <p className="mt-1 text-xs text-stone-500">{note}</p>}
    </motion.div>
  )
}

function SignupChart({ days }) {
  const max = Math.max(1, ...days.map((d) => d.count))
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
      <h2 className="font-semibold text-stone-900">New sign-ups</h2>
      <p className="text-sm text-stone-500">Last 14 days</p>
      <div className="mt-6 flex h-40 items-end gap-1.5">
        {days.map((d, i) => (
          <div key={d.day} className="group relative flex h-full flex-1 flex-col justify-end">
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${(d.count / max) * 100}%` }}
              transition={{ delay: i * 0.03, duration: 0.6 }}
              className={`min-h-1 rounded-t-md ${d.count ? 'bg-emerald-700 group-hover:bg-emerald-600' : 'bg-stone-200'}`}
            />
            <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-stone-900 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100">
              {d.count}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-xs text-stone-400">
        <span>{new Date(days[0].day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
        <span>Today</span>
      </div>
    </div>
  )
}

function OnlineNow({ online, usersById }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-stone-900/5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </span>
          Online now
        </h2>
        <span className="font-display text-2xl text-stone-900">{online.length}</span>
      </div>
      <p className="text-sm text-stone-500">Logged-in people with the site open — updates live.</p>
      <ul className="mt-4 max-h-64 space-y-3 overflow-y-auto">
        {online.map((p) => {
          const person = usersById[p.user_id]
          return (
            <li key={p.user_id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-800 text-xs font-semibold text-white">
                {initials(person?.full_name)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-stone-900">{person?.full_name || 'New user'}</p>
                <p className="truncate text-xs text-stone-500">Viewing {p.page}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${ROLE_STYLES[p.role] ?? ''}`}>
                {p.role}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function UsersTable({ users, onlineIds }) {
  const [query, setQuery] = useState('')
  const [role, setRole] = useState('all')
  const q = query.trim().toLowerCase()
  const shown = users.filter(
    (u) =>
      (role === 'all' || u.role === role) &&
      (!q || u.full_name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)),
  )

  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
      <div className="flex flex-col gap-4 border-b border-stone-100 p-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="font-semibold text-stone-900">All users</h2>
          <p className="text-sm text-stone-500">{users.length} accounts, most recently active first.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex items-center gap-2 rounded-full px-4 py-2 ring-1 ring-stone-300 focus-within:ring-2 focus-within:ring-emerald-700">
            <Search className="h-4 w-4 text-stone-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or email"
              className="w-full bg-transparent text-sm outline-none sm:w-48"
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {ROLE_FILTERS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold capitalize transition ${
                  role === r ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-stone-400">
            <tr>
              <th className="px-6 py-3 font-semibold">User</th>
              <th className="px-6 py-3 font-semibold">Role</th>
              <th className="px-6 py-3 font-semibold">Last active</th>
              <th className="px-6 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {shown.map((u) => {
              const isOnline = onlineIds.has(u.id)
              return (
                <tr key={u.id} className="transition hover:bg-stone-50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <span className="relative grid h-9 w-9 shrink-0 place-items-center rounded-full bg-stone-200 text-xs font-semibold text-stone-700">
                        {initials(u.full_name)}
                        {isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-stone-900">{u.full_name || '—'}</p>
                        <p className="truncate text-xs text-stone-500">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${ROLE_STYLES[u.role] ?? ''}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                    {isOnline ? <span className="font-semibold text-emerald-700">Online now</span> : timeAgo(u.last_seen_at ?? u.last_sign_in_at)}
                  </td>
                  <td className="whitespace-nowrap px-6 py-3 text-stone-600">
                    {new Date(u.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!shown.length && <p className="px-6 py-10 text-center text-sm text-stone-500">No users match.</p>}
      </div>
    </div>
  )
}

export default function Admin() {
  const { online } = usePresence()
  const stats = useAsync(fetchAdminStats, 'stats')
  const users = useAsync(fetchAdminUsers, 'users')
  const { reload: reloadStats } = stats
  const { reload: reloadUsers } = users

  // Refresh the numbers every minute while the dashboard is open.
  useEffect(() => {
    const timer = setInterval(() => {
      reloadStats()
      reloadUsers()
    }, 60000)
    return () => clearInterval(timer)
  }, [reloadStats, reloadUsers])

  const s = stats.data
  const userList = users.data ?? []
  const usersById = Object.fromEntries(userList.map((u) => [u.id, u]))
  const onlineIds = new Set(online.map((p) => p.user_id))
  const error = stats.error || users.error

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <motion.div variants={stagger(0.08)} initial="hidden" animate="show">
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-800">
            Admin
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 font-display text-5xl font-medium tracking-tight text-stone-900">
            Platform <em className="text-emerald-800"><TypeWriter text="overview." /></em>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-2 text-stone-500">
            Users, activity, bookings and revenue across Travel &amp; Stays.
          </motion.p>
        </motion.div>
        <button
          type="button"
          onClick={() => {
            reloadStats()
            reloadUsers()
          }}
          className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 transition hover:bg-stone-50"
        >
          <RefreshCw className={`h-4 w-4 ${stats.loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mt-8">
          <Alert>Could not load the dashboard: {error}</Alert>
        </div>
      )}

      {!s && !error ? (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="shimmer h-36 rounded-2xl" />
          ))}
        </div>
      ) : (
        s && (
          <>
            <motion.div
              variants={stagger(0.05)}
              initial="hidden"
              animate="show"
              className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              <StatCard
                icon={Activity}
                label="Online now"
                value={online.length}
                note="Live, logged-in visitors"
              />
              <StatCard
                icon={Users}
                label="Active users"
                value={s.active_24h}
                note={`Last 24 h · ${s.active_7d} in the last 7 days`}
                accent="text-sky-800 bg-sky-50"
              />
              <StatCard
                icon={UserPlus}
                label="Total users"
                value={s.users}
                note={`${s.travelers} travellers · ${s.hosts} hosts · ${s.guides} guides · +${s.new_users_7d} this week`}
                accent="text-violet-800 bg-violet-50"
              />
              <StatCard
                icon={BedDouble}
                label="Listings"
                value={s.listings}
                note={`${s.active_listings} live in search`}
                accent="text-amber-800 bg-amber-50"
              />
              <StatCard
                icon={CalendarCheck}
                label="Bookings"
                value={s.bookings}
                note={`${s.pending_bookings} awaiting host · ${s.paid_bookings} paid`}
              />
              <StatCard
                icon={Wallet}
                label="Revenue"
                value={formatNaira(s.revenue)}
                note="Total paid by guests"
                accent="text-sky-800 bg-sky-50"
              />
              <StatCard
                icon={Coins}
                label="Platform fees"
                value={formatNaira(s.platform_fees)}
                note="Service fees earned"
                accent="text-violet-800 bg-violet-50"
              />
              <StatCard
                icon={Star}
                label="Reviews"
                value={s.reviews}
                note={s.avg_rating ? `Average ${s.avg_rating} ★` : 'No reviews yet'}
                accent="text-amber-800 bg-amber-50"
              />
            </motion.div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              {s.signups_14d && <SignupChart days={s.signups_14d} />}
              <OnlineNow online={online} usersById={usersById} />
            </div>
          </>
        )
      )}

      {users.data && (
        <div className="mt-6">
          <UsersTable users={userList} onlineIds={onlineIds} />
        </div>
      )}
    </div>
  )
}
