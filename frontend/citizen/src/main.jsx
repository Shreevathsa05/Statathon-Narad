import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Routers from './Routers.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Routers />
  </StrictMode>,
)
