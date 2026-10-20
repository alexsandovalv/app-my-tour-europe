import { isDark, type ThemePrefs } from '../../domain/preferences'

/** Aplica tema y acento al <html>: clase `dark`, `data-accent` y `color-scheme`. */
export function applyTheme(prefs: ThemePrefs, systemPrefersDark: boolean): void {
  const root = document.documentElement
  const dark = isDark(prefs.mode, systemPrefersDark)
  root.classList.toggle('dark', dark)
  root.dataset.accent = prefs.accent
  root.style.colorScheme = dark ? 'dark' : 'light'
}

export const DARK_QUERY = '(prefers-color-scheme: dark)'

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.(DARK_QUERY).matches)
}
