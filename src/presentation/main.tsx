import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createApp } from '../composition'
import { App } from './App'
import './styles/app.css'

const container = document.getElementById('root')
if (!container) throw new Error('No se encontró #root')

createRoot(container).render(
  <StrictMode>
    <App composition={createApp()} />
  </StrictMode>,
)
