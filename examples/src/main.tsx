import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-ignore – CSS resolved by Vite alias at runtime
import '@loykin/gridkit/styles'
// @ts-ignore – CSS resolved by Vite
import './app.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
