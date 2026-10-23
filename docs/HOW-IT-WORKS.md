# How it works

Short answers to the questions assessors are likely to ask.

## 1. How is the app built?
- **The frontend** is a React single-page app, built with Vite and hosted on Vercel. Every push to GitHub redeploys it automatically.
- **The backend** is Supabase:
  - a PostgreSQL database
  - user accounts (Auth)
  - photo storage (Storage)
  - live updates (Realtime)
  - one server function (Edge Function) for payments
- The browser talks to Supabase directly. The database itself decides what each user is allowed to see or change, using row-level security, so there is no custom API server to maintain.

## 2. How are users and roles handled?
- When someone signs up, they choose **traveller**, **host** or **tour guide**. A database trigger then creates their `profiles` row with that role.
- Users can edit their name, phone number and bio, but **not their own role**. The database only allows updates to those three columns.
- **Admin** is set by the project owner directly in the database. It can't be chosen on the sign-up page.
- **Google sign-in** uses Supabase OAuth. A role picked on the sign-up page is applied once, and only to a brand-new account.

## 3. How is double-booking prevented?
- The `bookings` table has a PostgreSQL **exclusion constraint**. It makes it impossible to store two active bookings for the same listing whose date ranges overlap.
- This holds even if two people click "Book" at exactly the same moment: the database accepts one booking and rejects the other.
- Dates a host blocks on their calendar are checked in the same way when a booking is created.

## 4. How are prices calculated?
- **Total = nights × price per night + cleaning fee + 10% service fee.**
- The total is calculated **on the server**, in a database function, when the booking is created. Someone editing the page in their browser can't change what they pay.

## 5. How do payments work, and why are they secure?
1. The traveller clicks **Pay now** and the Paystack popup opens. It uses the **public** key, which is safe to have in the browser.
2. After Paystack reports success, the app calls the **`verify-payment` Edge Function**.
3. That function asks Paystack directly, using the **secret** key, whether the payment really succeeded and for the correct amount.
4. Only then is the booking marked as **paid**.

The secret key is stored only as a Supabase secret, never in the website code or in GitHub. A faked "success" in the browser therefore can't mark a booking as paid.

## 6. How does row-level security protect data?
Every table has rules that the database enforces on every request:
- Anyone can view active listings and reviews.
- Travellers can only see **their own** bookings, trips and saved stays.
- Hosts can only edit **their own** listings and see bookings for them.
- Logged-out visitors can't read profiles, bookings or payments, and can't create anything.
- The admin statistics functions check that the caller is an admin before returning anything.

## 7. How do "online now" and "active users" work?
- **Online now** uses **Supabase Realtime Presence**. Each logged-in browser tab joins a shared channel and shares only its user ID, role and current page. When a tab closes, it drops out automatically, so the admin dashboard updates live.
- **Active users** uses a `last_seen_at` timestamp, which the app updates every 5 minutes while someone is using it. The dashboard counts users seen in the last 24 hours and the last 7 days.

## 8. How do reviews work?
- A traveller can review a stay only **after check-out**, and only **once per booking**. This is enforced by a database function, not just the user interface.
- Reviews show only the guest's first name.
- After each review, the listing's average rating and review count are recalculated.
- Hosts can post one public reply to each review.

## 9. What about inactive users?
- After **30 minutes with no activity**, the user sees a "Still there?" warning. One minute later, they're logged out automatically.
- The activity timer is shared between browser tabs, so being active in one tab keeps you logged in in all of them.

## 10. What would come next?
- Tours and experiences for tour guides. The tab and the account role already exist.
- In-app messaging between guests and hosts.
- Email notifications for booking updates.
- Refunds through Paystack when a booking is cancelled.
