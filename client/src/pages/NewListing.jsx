import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { CalendarCheck, ImagePlus, Loader2, X, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { createListing } from '../lib/listings'
import { PROPERTY_TYPES } from '../lib/constants'
import { Alert } from '../components/AuthShell'

const MAX_PHOTOS = 8
const MAX_PHOTO_MB = 5
const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const BOOKING_MODES = [
  { value: 'request', icon: CalendarCheck, title: 'Request to book', text: 'You review and approve every booking.' },
  { value: 'instant', icon: Zap, title: 'Instant Book', text: 'Guests book right away. More bookings, less admin.' },
]

const inputClass =
  'mt-1.5 w-full rounded-xl border border-stone-300 px-3 py-3 text-sm text-stone-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'

function Section({ title, description, children }) {
  return (
    <section className="grid gap-6 border-b border-stone-200 py-8 md:grid-cols-3">
      <div>
        <h2 className="font-semibold text-stone-900">{title}</h2>
        <p className="mt-1 text-sm text-stone-500">{description}</p>
      </div>
      <div className="space-y-5 md:col-span-2">{children}</div>
    </section>
  )
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

export default function NewListing() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    title: '',
    property_type: 'apartment',
    description: '',
    city: '',
    address: '',
    max_guests: 2,
    bedrooms: 1,
    price_per_night: '',
    cleaning_fee: '',
    booking_mode: 'request',
  })
  const [photos, setPhotos] = useState([]) // [{ id, file, preview }]
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Free the photo preview URLs when leaving the page.
  const photosRef = useRef(photos)
  useEffect(() => {
    photosRef.current = photos
  })
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview)), [])

  function update(field) {
    return (e) => setForm({ ...form, [field]: e.target.value })
  }

  function addPhotos(e) {
    setError('')
    const chosen = Array.from(e.target.files)
    e.target.value = '' // lets the same file be picked again after removing it

    const valid = chosen.filter((file) => PHOTO_TYPES.includes(file.type) && file.size <= MAX_PHOTO_MB * 1024 * 1024)
    if (valid.length < chosen.length) {
      setError(`Some photos were skipped. Use JPG, PNG or WebP images under ${MAX_PHOTO_MB} MB.`)
    }

    const room = MAX_PHOTOS - photos.length
    const added = valid.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
    }))
    if (valid.length > room) setError(`You can add up to ${MAX_PHOTOS} photos.`)

    setPhotos([...photos, ...added])
  }

  function removePhoto(id) {
    const photo = photos.find((p) => p.id === id)
    if (photo) URL.revokeObjectURL(photo.preview)
    setPhotos(photos.filter((p) => p.id !== id))
  }

  function validate() {
    if (form.title.trim().length < 5) return 'Give your listing a title of at least 5 characters.'
    if (!form.city.trim()) return 'Enter the city your place is in.'
    if (!(Number(form.price_per_night) > 0)) return 'Enter a nightly price above ₦0.'
    if (!(Number(form.max_guests) >= 1)) return 'Your place must fit at least 1 guest.'
    if (photos.length === 0) return 'Add at least one photo.'
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const problem = validate()
    if (problem) {
      setError(problem)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    setError('')
    setSubmitting(true)
    try {
      const listing = await createListing(
        user.id,
        {
          title: form.title.trim(),
          property_type: form.property_type,
          description: form.description.trim(),
          city: form.city.trim(),
          address: form.address.trim() || null,
          max_guests: Number(form.max_guests),
          bedrooms: Number(form.bedrooms),
          price_per_night: Math.round(Number(form.price_per_night)),
          cleaning_fee: Math.max(Math.round(Number(form.cleaning_fee) || 0), 0),
          booking_mode: form.booking_mode,
        },
        photos.map((p) => p.file),
      )
      navigate(`/listings/${listing.id}`)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-5xl font-medium tracking-tight text-ink">
        List your <em className="text-emerald-700">place.</em>
      </h1>
      <p className="mt-2 text-stone-500">Tell travellers about your space. You can pause or delete it any time.</p>

      {error && (
        <div className="mt-6">
          <Alert>{error}</Alert>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <Section title="The basics" description="What kind of place is it, and what makes it special?">
          <Field label="Title">
            <input
              className={inputClass}
              placeholder="e.g. Bright 2-bedroom apartment near the marina"
              value={form.title}
              onChange={update('title')}
              maxLength={80}
            />
          </Field>

          <div>
            <span className="text-sm font-medium text-stone-700">Property type</span>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setForm({ ...form, property_type: type.value })}
                  aria-pressed={form.property_type === type.value}
                  className={`rounded-xl border px-3 py-3 text-sm font-medium transition ${
                    form.property_type === type.value
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                      : 'border-stone-300 text-stone-700 hover:border-stone-400'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <Field label="Description" hint="Mention the neighbourhood, amenities and anything guests should know.">
            <textarea
              rows={5}
              className={inputClass}
              placeholder="Describe your place…"
              value={form.description}
              onChange={update('description')}
            />
          </Field>
        </Section>

        <Section title="Location" description="Guests search by city. The street address is only for your records for now.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="City">
              <input className={inputClass} placeholder="e.g. Calabar" value={form.city} onChange={update('city')} />
            </Field>
            <Field label="Street address (optional)">
              <input className={inputClass} placeholder="e.g. 12 Marian Road" value={form.address} onChange={update('address')} />
            </Field>
          </div>
        </Section>

        <Section title="Space and price" description="How many people fit, and what does a night cost?">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Max guests">
              <input type="number" min="1" className={inputClass} value={form.max_guests} onChange={update('max_guests')} />
            </Field>
            <Field label="Bedrooms">
              <input type="number" min="0" className={inputClass} value={form.bedrooms} onChange={update('bedrooms')} />
            </Field>
            <Field label="Price per night (₦)">
              <input
                type="number"
                min="1"
                step="500"
                className={inputClass}
                placeholder="e.g. 35000"
                value={form.price_per_night}
                onChange={update('price_per_night')}
              />
            </Field>
            <Field label="Cleaning fee (₦)" hint="Optional, charged once per stay.">
              <input
                type="number"
                min="0"
                step="500"
                className={inputClass}
                placeholder="e.g. 5000"
                value={form.cleaning_fee}
                onChange={update('cleaning_fee')}
              />
            </Field>
          </div>
        </Section>

        <Section title="Booking mode" description="Decide whether guests can book straight away or need your approval.">
          <div className="grid gap-3 sm:grid-cols-2">
            {BOOKING_MODES.map(({ value, icon: Icon, title, text }) => {
              const active = form.booking_mode === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, booking_mode: value })}
                  aria-pressed={active}
                  className="relative rounded-xl bg-white p-5 text-left ring-1 ring-stone-900/10 transition hover:ring-stone-900/30"
                >
                  {active && (
                    <motion.span
                      layoutId="booking-mode"
                      className="absolute inset-0 rounded-xl bg-emerald-50 ring-2 ring-emerald-800"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative block">
                    <Icon className={`h-6 w-6 ${active ? 'text-emerald-800' : 'text-stone-400'}`} />
                    <span className="mt-3 block font-semibold text-stone-900">{title}</span>
                    <span className="mt-1 block text-sm text-stone-500">{text}</span>
                  </span>
                </button>
              )
            })}
          </div>
        </Section>

        <Section
          title="Photos"
          description={`Add up to ${MAX_PHOTOS} photos (JPG, PNG or WebP, max ${MAX_PHOTO_MB} MB each). The first one is your cover photo.`}
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <AnimatePresence initial={false}>
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28 }}
                className="group relative aspect-4/3 overflow-hidden rounded-2xl ring-1 ring-black/10"
              >
                <img src={photo.preview} alt="" className="h-full w-full object-cover" />
                {index === 0 && (
                  <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-semibold text-stone-800">
                    Cover
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removePhoto(photo.id)}
                  className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-stone-700 shadow hover:bg-white"
                  aria-label="Remove photo"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
            </AnimatePresence>

            {photos.length < MAX_PHOTOS && (
              <motion.label layout className="flex aspect-4/3 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-300 text-stone-500 transition hover:border-emerald-500 hover:text-emerald-600">
                <ImagePlus className="h-7 w-7" />
                <span className="text-sm font-medium">Add photos</span>
                <input type="file" accept={PHOTO_TYPES.join(',')} multiple className="sr-only" onChange={addPhotos} />
              </motion.label>
            )}
          </div>
        </Section>

        <div className="flex items-center justify-end gap-3 py-8">
          <Link to="/host/listings" className="rounded-xl px-5 py-3 text-sm font-semibold text-stone-700 hover:bg-stone-100">
            Cancel
          </Link>
          <button
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-60"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Publishing…' : 'Publish listing'}
          </button>
        </div>
      </form>
    </div>
  )
}
