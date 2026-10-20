import { isTabId, type TabId } from '../../domain/tabs'

export { TAB_IDS, isTabId, type TabId } from '../../domain/tabs'

/** Pestaña pedida por el hash de la URL (#age), o `null` si no hay una válida. */
export function tabFromHash(hash: string): TabId | null {
  const id = hash.replace('#', '')
  return isTabId(id) ? id : null
}
