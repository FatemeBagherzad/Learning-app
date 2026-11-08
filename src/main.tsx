import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

// We restore the scroll position ourselves, per tab.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Offline support for the built app only (it would just get in the way of `npm run dev`).
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {})
  })
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
