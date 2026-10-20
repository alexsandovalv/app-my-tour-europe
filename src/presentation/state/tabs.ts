export const TAB_IDS = ['map', 'cal', 'age', 'mad', 'hos', 'tra', 'ent'] as const
export type TabId = (typeof TAB_IDS)[number]

export function isTabId(value: string): value is TabId {
  return (TAB_IDS as readonly string[]).includes(value)
}

/** Pestaña inicial según el hash de la URL (#age), o el mapa. */
export function tabFromHash(hash: string): TabId {
  const id = hash.replace('#', '')
  return isTabId(id) ? id : 'map'
}
