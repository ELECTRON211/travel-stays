import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { MotionConfig } from 'motion/react'
import './index.css'
import App from './App.jsx'
import AuthProvider from './context/AuthProvider.jsx'
import SavedProvider from './context/SavedProvider.jsx'
import ToastProvider from './context/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
      <AuthProvider>
        <SavedProvider>
          {/* Turns animations off for people who ask their device to reduce motion */}
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </SavedProvider>
      </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
