import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'motion/react'
import { ArrowLeft, ImagePlus, Loader2, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { useAsync } from '../hooks/useAsync'
import { TOUR_CATEGORIES, WEEKDAYS, createTour, fetchTour, updateTour } from '../lib/tours'
import { Alert } from '../components/AuthShell'
import TypeWriter from '../components/TypeWriter'
import NotFound from './NotFound'

const inputClass =
  'mt-1.5 w-full rounded-xl bg-white px-4 py-3 text-sm ring-1 ring-stone-300 outline-none focus:ring-2 focus:ring-emerald-700'
const MAX_PHOTOS = 8

const EMPTY = {
  title: '',
  city: '',
  category: 'culture',
  description: '',
  itinerary: '',
  duration_hours: '3',
  start_time: '09:00',
  meeting_point: '',
  max_group: '8',
  price_per_person: '',
  included: '',
  languages: 'English',
  days: WEEKDAYS.map((d) => d.value),
}

function fromTour(tour) {
  return {
    ...EMPTY,
    ...tour,
    description: tour.description ?? '',
    itinerary: tour.itinerary ?? '',
    meeting_point: tour.meeting_point ?? '',
    duration_hours: String(tour.duration_hours),
    max_group: String(tour.max_group),
    price_per_person: String(tour.price_per_person),
    included: (tour.included ?? []).join(', '),
  }
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-stone-500">{hint}</span>}
    </label>
  )
}

function Form({ existing }) {
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState(existing ? fromTour(existing) : EMPTY)
  const [photos, setPhotos] = useState(() => (existing?.photos ?? []).map((url) => ({ existing: true, url, preview: url })))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  const toggleDay = (day) =>
    setForm((f) => ({ ...f, days: f.days.includes(day) ? f.days.filter((d) => d !== day) : [...f.days, day] }))

  function addPhotos(e) {
    const files = [...e.target.files].slice(0, MAX_PHOTOS - photos.length)
    setPhotos((list) => [...list, ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))])
    e.target.value = ''
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.days.length) return setError('Pick at least one day the tour runs.')
    if (!photos.length) return setError('Add at least one photo.')

    const values = {
      title: form.title.trim(),
      city: form.city.trim(),
      category: form.category,
      description: form.description.trim() || null,
      itinerary: form.itinerary.trim() || null,
      duration_hours: Number(form.duration_hours),
      start_time: form.start_time,
      meeting_point: form.meeting_point.trim() || null,
      max_group: Number(form.max_group),
      price_per_person: Number(form.price_per_person),
      included: form.included.split(',').map((s) => s.trim()).filter(Boolean),
      languages: form.languages.trim() || 'English',
      days: WEEKDAYS.map((d) => d.value).filter((d) => form.days.includes(d)),
    }

    setSaving(true)
    try {
      if (existing) {
        await updateTour(existing, values, photos)
        toast.show({ title: 'Tour updated', description: 'Your changes are live.' })
        navigate(`/tours/${existing.id}`)
      } else {
        const { id } = await createTour(user.id, values, photos.map((p) => p.file))
        toast.show({ title: 'Your tour is live!', description: 'Travellers can now find and book it.' })
        navigate(`/tours/${id}`)
      }
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-10 space-y-8">
      <section className="space-y-5 rounded-3xl bg-white p-6 ring-1 ring-stone-900/5 sm:p-8">
        <h2 className="font-display text-2xl text-stone-900">The basics</h2>
        <Field label="Tour title">
          <input className={inputClass} value={form.title} onChange={update('title')} placeholder="e.g. Calabar food walk: from Watt Market to edikang ikong" minLength={5} maxLength={100} required />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="City">
            <input className={inputClass} value={form.city} onChange={update('city')} placeholder="e.g. Calabar" required />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={form.category} onChange={update('category')}>
              {TOUR_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea className={inputClass} rows={4} maxLength={2000} value={form.description} onChange={update('description')} placeholder="What will people see, taste and learn?" />
        </Field>
        <Field label="Itinerary" hint="One stop per line — they show as numbered steps.">
          <textarea className={inputClass} rows={4} maxLength={2000} value={form.itinerary} onChange={update('itinerary')} placeholder={'Meet at the Marina\nWalk to Watt Market\nLunch at a local buka'} />
        </Field>
      </section>

      <section className="space-y-5 rounded-3xl bg-white p-6 ring-1 ring-stone-900/5 sm:p-8">
        <h2 className="font-display text-2xl text-stone-900">Schedule &amp; price</h2>
        <div>
          <span className="text-sm font-medium text-stone-700">Days it runs</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {WEEKDAYS.map((d) => {
              const on = form.days.includes(d.value)
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDay(d.value)}
                  aria-pressed={on}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${on ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                >
                  {d.label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Start time">
            <input type="time" className={inputClass} value={form.start_time} onChange={update('start_time')} required />
          </Field>
          <Field label="Duration (hours)">
            <input type="number" className={inputClass} min="0.5" max="24" step="0.5" value={form.duration_hours} onChange={update('duration_hours')} required />
          </Field>
          <Field label="Max group size">
            <input type="number" className={inputClass} min="1" max="50" value={form.max_group} onChange={update('max_group')} required />
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Price per person (₦)">
            <input type="number" className={inputClass} min="0" step="500" value={form.price_per_person} onChange={update('price_per_person')} placeholder="15000" required />
          </Field>
          <Field label="Languages">
            <input className={inputClass} value={form.languages} onChange={update('languages')} placeholder="English, Efik" />
          </Field>
        </div>
        <Field label="Meeting point">
          <input className={inputClass} value={form.meeting_point} onChange={update('meeting_point')} placeholder="e.g. Calabar Marina main gate" />
        </Field>
        <Field label="What's included" hint="Separate items with commas.">
          <input className={inputClass} value={form.included} onChange={update('included')} placeholder="Transport, Lunch, Bottled water" />
        </Field>
      </section>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-stone-900/5 sm:p-8">
        <h2 className="font-display text-2xl text-stone-900">Photos</h2>
        <p className="mt-1 text-sm text-stone-500">Up to {MAX_PHOTOS}. The first photo is the cover.</p>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {photos.map((p, i) => (
            <div key={p.preview} className="group relative aspect-4/3 overflow-hidden rounded-xl bg-stone-100">
              <img src={p.preview} alt="" className="h-full w-full object-cover" />
              {i === 0 && <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold">Cover</span>}
              <button
                type="button"
                onClick={() => setPhotos((list) => list.filter((x) => x !== p))}
                className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/60 text-white"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {photos.length < MAX_PHOTOS && (
            <label className="grid aspect-4/3 cursor-pointer place-items-center rounded-xl border-2 border-dashed border-stone-300 text-stone-500 transition hover:border-emerald-700 hover:text-emerald-800">
              <span className="flex flex-col items-center gap-1 text-sm font-medium">
                <ImagePlus className="h-6 w-6" /> Add photos
              </span>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={addPhotos} />
            </label>
          )}
        </div>
      </section>

      {error && <Alert>{error}</Alert>}

      <div className="flex justify-end gap-3">
        <Link to="/guide/tours" className="rounded-full px-6 py-3 text-sm font-semibold text-stone-700 ring-1 ring-stone-300 hover:ring-stone-900">
          Cancel
        </Link>
        <button disabled={saving} className="flex items-center gap-2 rounded-full bg-emerald-800 px-7 py-3 text-sm font-semibold text-white transition hover:bg-emerald-900 disabled:opacity-60">
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {saving ? 'Saving…' : existing ? 'Save changes' : 'Publish tour'}
        </button>
      </div>
    </form>
  )
}

// /guide/tours/new and /guide/tours/:id/edit
export default function TourForm() {
  const { id } = useParams()
  const { user } = useAuth()
  const { data: tour, loading, error } = useAsync(() => (id ? fetchTour(id) : Promise.resolve(null)), id ?? 'new')

  if (id && loading) return <div className="mx-auto max-w-3xl px-4 py-16"><div className="shimmer h-96 rounded-3xl" /></div>
  if (id && error) return <div className="mx-auto max-w-3xl px-4 py-16"><Alert>Could not load this tour: {error}</Alert></div>
  if (id && (!tour || tour.guide_id !== user.id)) return <NotFound />

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <Link to="/guide/tours" className="group inline-flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-stone-900">
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> My tours
      </Link>
      <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-4 font-display text-5xl font-medium tracking-tight text-stone-900">
        {id ? 'Edit your ' : 'Create a '}
        <em className="text-emerald-800"><TypeWriter text="tour." /></em>
      </motion.h1>
      <p className="mt-2 text-stone-500">Share what makes your city special — travellers book by date and group size.</p>
      <Form key={tour?.id ?? 'new'} existing={tour} />
    </div>
  )
}
