import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css' 

// Import ONLY the core posthog library
import posthog from 'posthog-js'

// Initialize PostHog safely
try {
  posthog.init('phc_owM5AN7X6qRjSPv72EqxrrQq4xrweZC5AKpgnnZAe4Vc', {
    api_host: 'https://us.i.posthog.com',
    capture_pageview: true, 
    capture_pageleave: true,
  })
  console.log('✅ PostHog initialized successfully!')
} catch (error) {
  console.error('⚠️ PostHog failed to initialize:', error)
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* NO PROVIDER NEEDED */}
    <App />
  </React.StrictMode>,
)