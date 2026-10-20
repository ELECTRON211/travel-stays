# Travel & Stays — web client

A marketplace where travellers find and book verified places to stay and local tours. This is the React web app; the backend is Supabase (Postgres database + authentication).

## Tech stack

| Part | Choice |
|---|---|
| UI | React 19, Vite, Tailwind CSS 4, lucide-react icons |
| Routing | React Router 7 |
| Backend | Supabase — Auth, Postgres with row-level security |

## Getting started

```bash
npm install
cp .env.example .env   # then fill in your Supabase URL and anon key
npm run dev            # http://localhost:5173
```

The database tables and the sign-up trigger are in [`../supabase/schema.sql`](../supabase/schema.sql).

## Project structure

```
src/
  main.jsx              App entry: router + auth provider
  App.jsx               Route table
  context/              AuthProvider (session + profile) and useAuth() hook
  lib/                  Supabase client, listing queries, formatting helpers
  hooks/useListings.js  Loads listings for a search
  components/           Navbar, Footer, SearchBar, ListingCard, auth layout
  pages/                Home, Stays (search results), Login, Signup, 404
```

## How it works

- **Auth:** users sign up as a traveler, host or tour guide. The chosen name and role are saved on the Supabase Auth user, and a database trigger copies them into the `profiles` table. `AuthProvider` keeps the session in React state so every page knows who is logged in.
- **Browsing:** listings are public, so visitors can browse before creating an account. Searching sends the city and guest count in the URL (`/stays?city=Calabar&guests=2`), so results can be shared and survive a refresh.

## Status

Phase 1 of the PRD, in progress.

- [x] Sign up / log in with roles (traveler, host, guide)
- [x] Browse and search stays by city and guest count
- [ ] Hosts create listings with photos
- [ ] Listing detail page
- [ ] Booking with double-booking protection
- [ ] Host dashboard
- [ ] Reviews
