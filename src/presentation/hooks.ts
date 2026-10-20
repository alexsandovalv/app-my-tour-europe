import { useEffect, useSyncExternalStore } from 'react'
import { isDark } from '../domain/preferences'
import { useAppStore } from './AppContext'
import { applyTheme, DARK_QUERY, systemPrefersDark } from './state/theme'

function subscribeSystem(onChange: () => void): () => void {
  const query = window.matchMedia?.(DARK_QUERY)
  query?.addEventListener('change', onChange)
  return () => query?.removeEventListener('change', onChange)
}

/** Preferencia de color del sistema, en vivo. */
export function useSystemDark(): boolean {
  return useSyncExternalStore(subscribeSystem, systemPrefersDark, () => false)
}

/** ¿Se está mostrando la interfaz oscura ahora mismo? */
export function useIsDark(): boolean {
  const mode = useAppStore((s) => s.theme.mode)
  return isDark(mode, useSystemDark())
}

/** Mantiene la clase `dark` y el acento del <html> sincronizados con el store. */
export function useApplyTheme(): void {
  const theme = useAppStore((s) => s.theme)
  const systemDark = useSystemDark()
  useEffect(() => applyTheme(theme, systemDark), [theme, systemDark])
}
