import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/theme.css'
import './styles/layout.css'
import './styles/ide.css'
import './i18n/config';
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
