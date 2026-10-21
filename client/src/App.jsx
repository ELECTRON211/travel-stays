import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Stays from './pages/Stays'
import ListingDetail from './pages/ListingDetail'
import MyListings from './pages/MyListings'
import NewListing from './pages/NewListing'
import BookingConfirmation from './pages/BookingConfirmation'
import Trips from './pages/Trips'
import Login from './pages/Login'
import Signup from './pages/Signup'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      {/* Pages with the navbar and footer */}
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/stays" element={<Stays />} />
        <Route path="/listings/:id" element={<ListingDetail />} />

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
    </Routes>
  )
}
