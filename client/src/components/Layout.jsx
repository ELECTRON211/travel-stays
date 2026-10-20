import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { ease } from '../lib/motion'
import Navbar from './Navbar'
import Footer from './Footer'

// Every page renders inside this shell. On the home page the navbar floats
// transparently over the hero photo; elsewhere the content starts below it.
export default function Layout() {
  const { pathname } = useLocation()
  const overlay = pathname === '/'

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar overlay={overlay} />
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className={`flex-1 ${overlay ? '' : 'pt-20'}`}
      >
        <Outlet />
      </motion.main>
      <Footer />
    </div>
  )
}
