import type { TabOrderStore } from '../../application/ports'
import { sanitizeTabOrder, type TabId } from '../../domain/tabs'
import type { KeyValueStorage } from './localStorageStore'

export const TAB_ORDER_KEY = 'viaje-europa-pestanas-v1'

/** Guarda el orden de las pestañas en localStorage; si no hay almacenamiento, vale solo la sesión. */
export class LocalTabOrderStore implements TabOrderStore {
  constructor(
    private readonly storage: KeyValueStorage | null,
    private readonly key: string = TAB_ORDER_KEY,
  ) {}

  load(): readonly TabId[] | null {
    try {
      const raw = this.storage?.getItem(this.key)
      return raw ? sanitizeTabOrder(JSON.parse(raw)) : null
    } catch {
      return null
    }
  }

  save(order: readonly TabId[]): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(order))
    } catch {
      /* sin almacenamiento */
    }
  }
}
