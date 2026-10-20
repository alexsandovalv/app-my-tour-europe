import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { AppContext, type AppServices } from './AppContext'
import { applyTheme, systemPrefersDark } from './state/theme'
import './styles/index.css'

/** Monta la aplicación. Recibe lo ya compuesto: no conoce las implementaciones de infraestructura. */
export function mount(services: AppServices): void {
  const container = document.getElementById('root')
  if (!container) throw new Error('No se encontró #root')

  // Antes del primer pintado, para que no parpadee entre claro y oscuro.
  applyTheme(services.store.getState().theme, systemPrefersDark())

  createRoot(container).render(
    <StrictMode>
      <AppContext.Provider value={services}>
        <App />
      </AppContext.Provider>
    </StrictMode>,
  )
}
