# Code guide

A walk through every part of the Travel & Stays code: what each file does, how the pieces connect, and how the main features work from start to finish. Read it from top to bottom once, then use it as a reference when someone asks "where is that in the code?".

---

## 1. The big picture

```
 Browser (React app, hosted on Vercel)
   │
   │  supabase-js (HTTPS + WebSocket)
   ▼
 Supabase
   ├── Auth ............ accounts, passwords, Google sign-in, sessions
   ├── Postgres ........ all data + the business rules (RLS, constraints, functions)
   ├── Storage ......... listing/tour photos (public), ID documents (private)
   ├── Realtime ........ "online now" presence on the admin dashboard
   └── Edge Function ... verify-payment ──► Paystack API (secret key lives here only)
```

**Key idea:** there is no separate backend server. The React app talks to Supabase directly, and the database itself decides what each user may read or change:
- **Row-level security (RLS)** policies control who can see or edit each row.
- **Database functions (RPCs)** do the sensitive work: creating bookings, working out prices, submitting reviews and the admin statistics.
- **Constraints** make bad data impossible, for example two overlapping bookings.

So even if someone edits the JavaScript in their browser, the rules still hold.

---

## 2. Folder map

```
travel-stays/
├── client/                      the React web app
│   ├── index.html               the single HTML page the app runs in
│   ├── vite.config.js           build tool config (React + Tailwind plugins)
│   ├── vercel.json              sends every URL to index.html so React Router handles it
│   ├── .env.example             which environment variables are needed (the real .env is git-ignored)
│   └── src/
│       ├── main.jsx             starts the app and wraps it in the providers
│       ├── App.jsx              the list of routes (URL → page)
│       ├── index.css            Tailwind theme: colours, fonts, animations
│       ├── pages/               one file per screen
│       ├── components/          reusable pieces used by several pages
│       ├── context/             app-wide state: login, toasts, saved stays, online presence
│       ├── hooks/               small reusable React hooks
│       └── lib/                 all talking to Supabase + helper functions
├── supabase/
│   ├── schema.sql               base tables: profiles and listings
│   ├── migrations/002–012       each later feature, run in order in the SQL Editor
│   ├── functions/verify-payment the server function that confirms Paystack payments
│   └── demo/                    scripts that add demo stays, tours and a past booking
└── docs/                        README extras: demo guide, how it works, this guide
```

**The rule the code follows:** pages never build database queries themselves. They call a function in `lib/` (for example `fetchListings()` or `createBooking()`), and only `lib/` talks to Supabase. That keeps pages simple and puts all the data logic in one place.

---

## 3. Start-up: `main.jsx` and `App.jsx`

**`main.jsx`** renders the app inside these wrappers, from the outside in:

| Wrapper | Why |
|---|---|
| `BrowserRouter` | enables page URLs (React Router) |
| `ToastProvider` | the pop-up messages ("Saved to your wishlist") |
| `AuthProvider` | who is logged in, their profile and role, and `signOut()` |
| `PresenceProvider` | joins the live "online users" channel and records "last seen" |
| `SavedProvider` | which stays the user has saved (the heart icons) |
| `MotionConfig` | turns animations off for people who ask for reduced motion |

**`App.jsx`** maps each URL to a page:
- Pages inside `<Layout>` get the navbar and footer.
- The full-screen pages (log in, sign up, password reset, logged out, Google callback) don't.
- Pages wrapped in `<ProtectedRoute>` need a logged-in user. `role="host"`, `"guide"` or `"admin"` also restricts them to that role.

---

## 4. App-wide state: `context/`

Each feature has two files: `XContext.js` creates the context and a `useX()` hook, and `XProvider.jsx` holds the state.

- **`AuthProvider.jsx`**
  - Restores the session when the page loads, then listens for log-in and log-out events.
  - Loads the user's row from `profiles`, which holds their name, role and verified status.
  - Exposes `user`, `loading`, `signOut()` and `refreshProfile()`.
  - `signOut()` leaves the page first and clears the user in the same step, so protected pages never flash. It then removes the stored login tokens, with a 3-second timeout so a slow network can't leave you stuck.
- **`ToastProvider.jsx`** shows and hides the toast notifications. `useToast().show({ title, description, type })`.
- **`SavedProvider.jsx`** loads the IDs of saved stays once, so every heart icon knows whether it's filled in.
- **`PresenceProvider.jsx`**
  - Joins the Supabase Realtime channel `online-users` and shares only `{user_id, role, page}`.
  - Updates the page as the user moves around the site.
  - Calls `touch_last_seen()` every 5 minutes, which powers "active users".

---

## 5. Hooks: `hooks/`

- **`useAsync(load, key)`**
  - Runs an async function and gives back `{ data, loading, error, reload }`.
  - Re-runs when `key` changes, and ignores stale results, so fast clicking never shows the wrong data.
  - Almost every page loads its data with this hook.
- **`useListings(filters)`** wraps `useAsync` around `fetchListings()` for the search pages.
- **`useTypingCycle(words)`** powers the typing animation in the search box placeholder.

---

## 6. Data and helpers: `lib/`

| File | What it does |
|---|---|
| `supabase.js` | creates the one Supabase client from the `.env` URL and public key |
| `listings.js` | search, load, create, edit, pause and delete listings; upload and remove photos in Storage |
| `bookings.js` | `quote()` (the price shown before booking), `createBooking()` (calls the `create_booking` database function), trips, host requests, accept, decline and cancel |
| `payments.js` | `payForBooking()`: start the payment on the server, open the Paystack popup, then ask the Edge Function to verify it |
| `calendar.js` | host calendar: load booked and blocked dates, block and unblock dates |
| `reviews.js` | load a listing's reviews, submit a review, host reply |
| `saved.js` | wishlist: save, unsave, list saved stays |
| `profile.js` | update name, phone and bio; change password |
| `tours.js` | tours: search, create, edit, pause, delete, places left on a date, book, accept, decline, cancel; also date and price helpers |
| `safety.js` | upload ID documents and submit verification, report a listing or tour, plus the admin review functions |
| `admin.js` | admin statistics and user list, "last seen" heartbeat, applying the chosen role after a Google sign-up |
| `session.js` | the shared "last activity" time used for the 30-minute idle logout; wiping stored tokens |
| `dates.js` | dates as `"YYYY-MM-DD"` strings: add days, count nights, format for display |
| `format.js` | naira formatting (`₦45,000`), masking emails and phones, initials |
| `constants.js` | amenities, house rules, cancellation policies, property types, destinations |
| `images.js` | photo and video URLs, including the rotating video playlists |
| `motion.js` | shared animation settings (`fadeUp`, `stagger`) |

---

## 7. Components: `components/`

**Layout and navigation**
- `Layout.jsx`: navbar plus page plus footer.
- `Navbar.jsx`: links change by role. Travellers see Saved and My trips, hosts see My listings, guides see My tours, admins see Dashboard. Also the account menu.
- `Footer.jsx`, `Logo.jsx`.
- `ProtectedRoute.jsx`: sends logged-out visitors to the log in page, and shows a "this page is for hosts" message to the wrong role.
- `SessionTimeout.jsx`: watches for activity, shows a "Still there?" warning at 29 minutes, and logs out at 30.

**Listings and search**
- `SearchBar.jsx`: where, check-in, check-out and guests. It puts the search into the URL, so results can be shared.
- `DiscoveryToggle.jsx`: the Stays / Tours / Combined Trips tabs.
- `ListingCard.jsx`: the card, the photo or placeholder cover, the Verified badge, the rating and the grid with loading skeletons.
- `TourCard.jsx`: the same for tours, plus the category icons.
- `SaveButton.jsx`, `ShareButton.jsx`, `Lightbox.jsx` (full-screen photo viewer).

**Booking and payments**
- `BookingWidget.jsx`: the booking box on a listing. It handles dates, guests and the price breakdown, then calls `createBooking()`.
- `DateRangePicker.jsx`: a calendar that greys out booked dates.
- `PayButton.jsx`: the "Pay now" button that runs `payForBooking()`.

**Reviews and safety**
- `StarRating.jsx`, `ListingReviews.jsx` (average, rating bars, reviews, host replies), `ReviewForm.jsx`.
- `ReportButton.jsx`: the Report dialog on listings and tours.
- `VerificationCard.jsx`: ID upload on the Profile page for hosts and guides.
- `AdminTrust.jsx`: the admin's ID verification queue and reports list.

**Accounts and look**
- `AuthShell.jsx`: the split-screen log in and sign-up layout, with the rotating video.
- `GoogleButton.jsx`: "Continue with Google".
- `PasswordShell.jsx`: the layout for the password pages.
- `BackgroundVideo.jsx`: a silent background video that can rotate through a playlist. It's skipped on phones and for reduced motion.
- `VideoModal.jsx`, `TypeWriter.jsx`, `Reveal.jsx` (fade in on scroll), `InfoPage.jsx` (the layout for Help, Terms, Privacy and Safety).

---

## 8. Pages: `pages/`

| Page | URL | Who | What |
|---|---|---|---|
| `Home.jsx` | `/` | everyone | landing page: video hero, search, cities, featured stays, how it works |
| `Stays.jsx` | `/stays` | everyone | search results; `?mode=tours` shows tours, `?mode=trips` shows stays and tours together |
| `ListingDetail.jsx` | `/listings/:id` | everyone | gallery, details, amenities, rules, reviews, booking box, Report |
| `TourDetail.jsx` | `/tours/:id` | everyone | itinerary, meeting point, guide card, booking box, places left |
| `Trips.jsx` | `/trips` | logged in | my bookings: Upcoming, Past, Cancelled and Tours tabs |
| `BookingConfirmation.jsx` | `/trips/:id` | logged in | one booking: status, Pay now, leave a review |
| `Saved.jsx` | `/saved` | logged in | wishlist |
| `Profile.jsx` | `/profile` | logged in | personal details, password, ID verification |
| `MyListings.jsx` | `/host/listings` | host | host dashboard: stats, requests, accept or decline, manage listings |
| `NewListing.jsx` / `EditListing.jsx` | `/host/listings/new`, `/:id/edit` | host | the listing form (one form used for both) |
| `HostCalendar.jsx` | `/host/listings/:id/calendar` | host | block or unblock dates |
| `MyTours.jsx` | `/guide/tours` | guide | guide dashboard: requests, departures, earnings, tours |
| `TourForm.jsx` | `/guide/tours/new`, `/:id/edit` | guide | create or edit a tour |
| `Admin.jsx` | `/admin` | admin | stats, online now, sign-ups chart, ID queue, reports, users |
| `Login.jsx` / `Signup.jsx` | `/login`, `/signup` | everyone | email and password or Google; sign up picks a role |
| `AuthCallback.jsx` | `/auth/callback` | everyone | finishes Google sign-in and applies the chosen role |
| `ForgotPassword.jsx` / `ResetPassword.jsx` | | everyone | password reset by email |
| `LoggedOut.jsx` | `/logged-out` | everyone | the goodbye page after logging out |
| `About`, `Help`, `Terms`, `Privacy`, `Safety`, `NotFound` | | everyone | information pages and the 404 page |

---

## 9. The database: `supabase/`

Run in this order in the SQL Editor. Each file is safe to run again.

| File | Adds |
|---|---|
| `schema.sql` | `profiles` (name, role) and `listings`; a trigger that creates a profile on sign-up |
| `002_host_listings.sql` | listing ownership (`host_id`), photos, status, the `is_host()` check, host-only insert, update and delete policies, the `listing-photos` bucket |
| `003_bookings.sql` | `bookings` with the **exclusion constraint** (no overlapping dates); `create_booking()`, which works out the price on the server; accept, decline and cancel functions |
| `004_host_guest_names.sql` | hosts can see the names of guests who booked with them, and nobody else's |
| `005_profile_details.sql` | phone and bio; users may update only their name, phone and bio, never their role |
| `006_listing_details_and_saved.sql` | amenities, house rules, check-in times, cancellation policy; `saved_listings` (wishlist) |
| `007_payments.sql` | payment status on bookings, the `payments` table, `start_payment()` (works out the amount in kobo on the server) |
| `008_listing_blocks.sql` | host calendar blocks; booking now also refuses blocked dates |
| `009_reviews.sql` | `reviews`; `submit_review()` (only after check-out, once per booking, recalculates the rating); `reply_to_review()` |
| `010_admin_and_google.sql` | `last_seen_at`, `is_admin()`, `admin_stats()`, `admin_users()`, `set_initial_role()` for Google sign-ups |
| `011_tours.sql` | `tours` and `tour_bookings`; `create_tour_booking()` (locks the tour while counting places); places left, accept, decline, cancel; guide photo uploads |
| `012_safety.sql` | `profiles.verified`, the private `verification-docs` bucket, verification requests, reports, and the admin review functions |

**Edge Function: `functions/verify-payment/index.ts`** (runs on Supabase's servers, in Deno):
1. It receives a payment reference from the app.
2. It looks up the matching payment row, which holds the amount the server expects.
3. It asks the Paystack API, using the **secret key**, whether that reference succeeded **for exactly that amount in NGN**.
4. Only then does it mark the payment as successful and the booking as `paid`.

**Demo scripts in `demo/`:**
- `seed_listings.sql` (15 stays)
- `seed_all_states.sql` (29 more, so all 36 states and the FCT are covered)
- `seed_tours.sql` (10 tours)
- `past_booking.sql` (a finished stay, so a review can be demoed)

---

## 10. The main features, step by step

### Sign up and log in
1. `Signup.jsx` calls `supabase.auth.signUp()` with the name and chosen role.
2. A database trigger (`schema.sql`) copies them into a new `profiles` row.
3. `AuthProvider` sees the new session and loads the profile, so the navbar changes to match the role.
4. With Google, `GoogleButton.jsx` sends the person to Google. They come back to `/auth/callback`, and `AuthCallback.jsx` applies the role picked on the sign-up page through `set_initial_role()`, which only works for brand-new accounts.

### Searching
1. `SearchBar` puts `?city=…&checkin=…&guests=…` into the URL.
2. `Stays.jsx` reads the URL, and `useListings()` calls `fetchListings()`, which queries active listings with those filters.

### Booking a stay
1. `BookingWidget` shows `quote()`: nights × price, plus the cleaning fee, plus a 10% service fee.
2. On submit, `createBooking()` calls the database function `create_booking()`. The function checks the dates, the number of guests and the listing, then works out the price **itself**.
3. The insert either succeeds or hits the **exclusion constraint**, if another booking overlaps. In that case the user sees "those dates were just booked".
4. Instant Book listings are `confirmed` straight away; others are `pending` until the host accepts in `MyListings.jsx`.

### Paying
1. `PayButton` calls `payForBooking()` in `lib/payments.js`.
2. `start_payment()` creates a payment row with a unique reference and the amount, taken from the booking on the server.
3. The Paystack popup opens with the **public** key, and the user pays.
4. `verifyPayment()` calls the `verify-payment` Edge Function, which confirms the payment with Paystack and marks the booking as paid.

### Reviews
1. After check-out, `BookingConfirmation.jsx` shows `ReviewForm`.
2. `submit_review()` refuses the review if the stay hasn't ended or was already reviewed. Otherwise it saves the review and updates the listing's average rating and review count.

### Tours
1. A guide creates a tour in `TourForm.jsx`.
2. A traveller picks a date and a number of people in `TourDetail.jsx`, which shows the places left using `tour_spots_left()`.
3. `create_tour_booking()` **locks the tour row**, adds up the people already booked on that date, and refuses the booking if it would go over the group limit.
4. The guide accepts or declines in `MyTours.jsx`.

### ID verification and reports
1. A host or guide uploads an ID and a selfie in `VerificationCard.jsx`. The files go into the **private** bucket, in their own folder, and `submit_verification()` records the request.
2. The admin opens the files in `AdminTrust.jsx` through 10-minute signed links, then approves or rejects. Approving sets `profiles.verified` and the badge on the person's listings.
3. Anyone logged in can report through `ReportButton.jsx`, which calls `submit_report()`. The admin can dismiss the report or pause the listing or tour with `resolve_report()`.

### Admin "online now"
`PresenceProvider` (everyone logged in) shares `{user_id, role, page}` on a Realtime channel. `Admin.jsx` reads the same channel, so the list updates the moment someone opens or closes the site.

### Idle logout
1. `lib/session.js` stores the time of the last activity in localStorage, which every open tab shares.
2. `SessionTimeout.jsx` checks it, warns at 29 minutes, and calls `signOut()` at 30.
3. You land on `/logged-out`, which explains why.

---

## 11. Words you may be asked about

| Term | Meaning here |
|---|---|
| **SPA** | single-page app: one HTML page; React swaps the screens without reloading |
| **RLS (row-level security)** | Postgres rules attached to each table that decide which rows a user may see or change |
| **RPC / database function** | a function stored in Postgres that the app calls by name, such as `create_booking()` |
| **`security definer`** | the function runs with the database owner's rights, but only does what its own checks allow |
| **Exclusion constraint** | a rule that stops two rows from conflicting; here, two bookings for one listing with overlapping dates |
| **Row lock (`for update`)** | makes other bookings for the same tour wait, so the place count is always correct |
| **Edge Function** | a small server-side function on Supabase, used where a secret key is needed |
| **Presence** | Supabase Realtime's live list of who is connected to a channel |
| **Environment variables** | settings such as the Supabase URL and public keys, kept in `.env`, which is never committed |
