import { EMPTY_BOOKING_STATE, sanitizeBookingState, type BookingState } from '../../domain/booking'

export const STORAGE_KEY = 'viaje-europa-estado-v2'

/** Subconjunto de `Storage` que usamos; permite probar sin navegador. */
export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
}

/** Lectura y escritura locales. Cada acceso se protege: el navegador puede bloquear el almacenamiento. */
export class LocalBookingCache {
  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key: string = STORAGE_KEY,
  ) {}

  load(): BookingState {
    try {
      const raw = this.storage?.getItem(this.key)
      return raw ? sanitizeBookingState(JSON.parse(raw)) : EMPTY_BOOKING_STATE
    } catch {
      return EMPTY_BOOKING_STATE
    }
  }

  save(state: BookingState): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(state))
    } catch {
      /* sin almacenamiento: la sesión sigue funcionando en memoria */
    }
  }
}

export function browserStorage(): KeyValueStorage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}
