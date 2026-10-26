import { Link } from 'react-router-dom'
import { motion } from 'motion/react'
import { BadgeCheck, CreditCard, Flag, Lock, PhoneCall, Star } from 'lucide-react'
import InfoPage, { InfoSection } from '../components/InfoPage'
import { fadeUp, stagger } from '../lib/motion'

const PROTECTIONS = [
  { icon: BadgeCheck, title: 'ID-verified hosts and guides', text: 'Hosts and guides can send a government ID and a selfie. Our team checks them before the Verified badge appears.' },
  { icon: Star, title: 'Real reviews only', text: 'Only guests who actually stayed can leave a review, so problems come to light quickly.' },
  { icon: CreditCard, title: 'Secure payments', text: 'Card payments go through Paystack and are checked on our server — never pay a host outside the app.' },
  { icon: Flag, title: 'Report in one tap', text: 'Every listing and tour has a Report button. Unsafe listings can be paused immediately.' },
  { icon: Lock, title: 'Private details', text: 'Your email and phone are hidden. Hosts and guides only see your first name until you book.' },
  { icon: PhoneCall, title: 'Help when you need it', text: 'Emergency numbers are listed below, and our team reads every report.' },
]

export default function Safety() {
  return (
    <InfoPage
      eyebrow="Trust & safety"
      title="Travel with"
      accent="peace of mind."
      intro="How Travel & Stays keeps travellers, hosts and guides safe — and what you can do to stay safe on every trip."
    >
      <motion.div
        variants={stagger(0.06)}
        initial="hidden"
        animate="show"
        className="grid gap-3 sm:grid-cols-2"
      >
        {PROTECTIONS.map(({ icon: Icon, title, text }) => (
          <motion.div key={title} variants={fadeUp} className="rounded-2xl bg-white p-5 ring-1 ring-stone-900/5">
            <Icon className="h-6 w-6 text-emerald-700" strokeWidth={1.75} />
            <p className="mt-3 font-semibold text-stone-900">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-stone-600">{text}</p>
          </motion.div>
        ))}
      </motion.div>

      <InfoSection id="emergency" title="In an emergency">
        <div className="rounded-2xl bg-red-50 p-5 text-red-900">
          <p className="text-lg font-semibold">Call 112 — Nigeria's free national emergency number.</p>
          <p className="mt-1 text-sm">It connects you to the police, fire service and ambulance from any phone, even without credit.</p>
        </div>
        <ul>
          <li>Get somewhere safe first, then report the listing or tour to us so we can act.</li>
          <li>
            Message our team through the <Link to="/help#contact">contact form</Link> with your booking reference.
          </li>
        </ul>
      </InfoSection>

      <InfoSection id="travellers" title="Tips for travellers">
        <ul>
          <li><strong>Book and pay only inside the app.</strong> If anyone asks you to pay by bank transfer or cash to "secure" a booking, report them.</li>
          <li><strong>Look for the Verified badge</strong> and read recent reviews before you book.</li>
          <li><strong>Share your trip.</strong> Send the address, dates and host's first name to a friend or family member.</li>
          <li><strong>Meet tour guides at the public meeting point</strong> shown on the tour page, not at a private address.</li>
          <li><strong>Check travel advisories</strong> before visiting a new state, and plan daytime arrivals where you can.</li>
          <li><strong>Trust your instincts.</strong> If something feels wrong, leave and tell us — your safety matters more than a booking.</li>
        </ul>
      </InfoSection>

      <InfoSection id="hosts" title="Tips for hosts and guides">
        <ul>
          <li><strong>Get verified</strong> from your Profile page — travellers book verified hosts and guides more often.</li>
          <li><strong>Keep conversations and payments on Travel &amp; Stays</strong> so every booking is recorded.</li>
          <li><strong>Describe your place or tour honestly</strong> with real, recent photos.</li>
          <li><strong>Report guests who behave unsafely</strong> by contacting our team with the booking reference.</li>
        </ul>
      </InfoSection>

      <InfoSection id="limits" title="What we can and can't check">
        <p>
          We check the identity documents that hosts and guides send us, and we act on every report. We can't run criminal
          background checks, and the Verified badge is not a guarantee of anyone's behaviour — so please use the tips above on every trip.
        </p>
        <p>
          Questions? See the <Link to="/help">Help centre</Link> or read our <Link to="/terms">Terms</Link>.
        </p>
      </InfoSection>
    </InfoPage>
  )
}
