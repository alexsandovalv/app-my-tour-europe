import type { PreferencesStore } from '../../application/ports'
import { sanitizeThemePrefs, type ThemePrefs } from '../../domain/preferences'
import type { KeyValueStorage } from './localStorageStore'

export const PREFERENCES_KEY = 'viaje-europa-tema-v1'

/** Guarda tema y acento en localStorage; si no hay almacenamiento, la sesión sigue en memoria. */
export class LocalPreferencesStore implements PreferencesStore {
  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key: string = PREFERENCES_KEY,
  ) {}

  load(): ThemePrefs | null {
    try {
      const raw = this.storage?.getItem(this.key)
      return raw ? sanitizeThemePrefs(JSON.parse(raw)) : null
    } catch {
      return null
    }
  }

  save(prefs: ThemePrefs): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(prefs))
    } catch {
      /* sin almacenamiento */
    }
  }
}
