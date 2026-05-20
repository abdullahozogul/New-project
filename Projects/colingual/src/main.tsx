import './fonts.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { initMobileAuthListener } from './lib/mobileAuthListener'
import App from './App.tsx'

initMobileAuthListener()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
