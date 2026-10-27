import { Link } from 'react-router-dom'
import InfoPage, { InfoSection } from '../components/InfoPage'

const VISIBILITY = [
  { item: 'Email address', who: 'Only you. Never shown to hosts or other users.' },
  { item: 'Name and phone', who: 'You, and hosts you have booked with.' },
  { item: 'Bookings', who: 'You, and the host of that listing.' },
  { item: 'Saved listings', who: 'Only you.' },
  { item: 'Listings and photos', who: 'Everyone (while the listing is active).' },
  { item: 'Booked dates on a listing', who: 'Everyone — dates only, never who booked them.' },
]

export default function Privacy() {
  return (
    <InfoPage
      eyebrow="Legal"
      title="Privacy"
      accent="Policy"
      intro="What information we collect, why we need it and who can see it. We collect only what's needed to run your bookings."
      updated="21 October 2026"
    >
      <InfoSection title="What we collect">
        <ul>
          <li>
            <strong>Account details:</strong> your name, email address, password (stored scrambled, never readable)
            and role.
          </li>
          <li>
            <strong>Profile details you choose to add:</strong> phone number and a short bio.
          </li>
          <li>
            <strong>Bookings:</strong> the listing, dates, number of guests and price.
          </li>
          <li>
            <strong>Hosts:</strong> listing details and the photos you upload.
          </li>
          <li>
            <strong>Saved listings</strong> on your wishlist.
          </li>
        </ul>
      </InfoSection>

      <InfoSection title="How we use it">
        <ul>
          <li>To create your account, keep you logged in and protect it.</li>
          <li>To make, show and manage bookings, and to let hosts contact the guests who booked with them.</li>
          <li>To show listings, prices and availability to travellers.</li>
        </ul>
        <p>We do not sell your personal information.</p>
      </InfoSection>

      <InfoSection title="Who can see what">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-stone-900/5">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase tracking-wider text-stone-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Information</th>
                <th className="px-5 py-3 font-semibold">Who can see it</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {VISIBILITY.map(({ item, who }) => (
                <tr key={item}>
                  <td className="px-5 py-3 font-medium text-stone-900">{item}</td>
                  <td className="px-5 py-3">{who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          These rules are enforced inside our database with row-level security, not just hidden on screen — so the
          information can’t be read by anyone who isn’t allowed to see it.
        </p>
      </InfoSection>

      <InfoSection title="Where it's stored">
        <p>
          Your data is stored with Supabase, our database and hosting provider, and is sent over encrypted (HTTPS)
          connections. Payments are handled by Paystack; we keep only a payment reference and status, never your card
          details.
        </p>
      </InfoSection>

      <InfoSection title="Cookies and browser storage">
        <p>We keep a few small items in your browser so the site works:</p>
        <ul>
          <li>Your login session, so you stay logged in.</li>
          <li>The time of your last activity, so we can log you out after 30 minutes of inactivity.</li>
          <li>Display preferences, such as grid or list view on the host dashboard.</li>
        </ul>
        <p>We do not use advertising or tracking cookies.</p>
      </InfoSection>

      <InfoSection title="Your choices">
        <ul>
          <li>
            View and edit your name, phone and bio any time on your <Link to="/profile">profile</Link>.
          </li>
          <li>Remove saved listings, or cancel bookings before check-in.</li>
          <li>
            To get a copy of your data, <Link to="/help#contact">contact us</Link>. You can delete your account
            yourself from your <Link to="/profile">Profile</Link> page.
          </li>
        </ul>
        <p>This policy is written with the Nigeria Data Protection Act 2023 in mind.</p>
      </InfoSection>

      <InfoSection title="Contact">
        <p>
          Questions about your privacy? <Link to="/help#contact">Send us a message</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
