import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import SessionTimeout from './components/SessionTimeout'
import Home from './pages/Home'
import Stays from './pages/Stays'
import ListingDetail from './pages/ListingDetail'
import MyListings from './pages/MyListings'
import NewListing from './pages/NewListing'
import BookingConfirmation from './pages/BookingConfirmation'
import Trips from './pages/Trips'
import Profile from './pages/Profile'
import Saved from './pages/Saved'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Help from './pages/Help'
import About from './pages/About'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <>
      <SessionTimeout />
      <Routes>
      {/* Pages with the navbar and footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/listings/:id" element={<ListingDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/help" element={<Help />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route
          path="/saved"
          element={
            <ProtectedRoute>
              <Saved />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips"
          element={
            <ProtectedRoute>
              <Trips />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trips/:id"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />

        {/* Host-only pages */}
        <Route
          path="/host/listings"
          element={
            <ProtectedRoute role="host">
              <MyListings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/host/listings/new"
          element={
            <ProtectedRoute role="host">
              <NewListing />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound />} />
      </Route>

      {/* Full-screen auth pages */}
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      </Routes>
    </>
  )
}
