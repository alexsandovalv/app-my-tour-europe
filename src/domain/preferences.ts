/** Preferencias visuales del usuario. */
export const THEME_MODES = ['light', 'dark', 'system'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export const ACCENTS = ['esmeralda', 'azul', 'violeta', 'terracota'] as const
export type AccentId = (typeof ACCENTS)[number]

export interface ThemePrefs {
  readonly mode: ThemeMode
  readonly accent: AccentId
}

export const DEFAULT_THEME: ThemePrefs = { mode: 'system', accent: 'esmeralda' }

export function sanitizeThemePrefs(raw: unknown): ThemePrefs {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_THEME
  const obj = raw as Record<string, unknown>
  return {
    mode: (THEME_MODES as readonly unknown[]).includes(obj.mode)
      ? (obj.mode as ThemeMode)
      : DEFAULT_THEME.mode,
    accent: (ACCENTS as readonly unknown[]).includes(obj.accent)
      ? (obj.accent as AccentId)
      : DEFAULT_THEME.accent,
  }
}

/** ¿Se debe pintar la interfaz oscura? "system" sigue la preferencia del sistema. */
export function isDark(mode: ThemeMode, systemPrefersDark: boolean): boolean {
  return mode === 'system' ? systemPrefersDark : mode === 'dark'
}

/** Alterna entre claro y oscuro a partir de lo que se ve ahora (también desde "system"). */
export function toggledMode(mode: ThemeMode, systemPrefersDark: boolean): ThemeMode {
  return isDark(mode, systemPrefersDark) ? 'light' : 'dark'
}
