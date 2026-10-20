/**
 * Pestañas de la app y su orden. El orden lo elige el usuario arrastrando; aquí viven las reglas puras
 * (sanear lo guardado, mover, desplazar) para poder probarlas sin navegador.
 */
export const TAB_IDS = ['map', 'cal', 'age', 'mad', 'hos', 'tra', 'ent', 'bud'] as const
export type TabId = (typeof TAB_IDS)[number]

export const DEFAULT_TAB_ORDER: readonly TabId[] = TAB_IDS

export function isTabId(value: unknown): value is TabId {
  return typeof value === 'string' && (TAB_IDS as readonly string[]).includes(value)
}

/**
 * Orden válido a partir de datos externos: conserva los ids reconocidos sin repetir y agrega al final
 * las pestañas que falten (por ejemplo, una pestaña nueva en una versión posterior).
 */
export function sanitizeTabOrder(raw: unknown): readonly TabId[] {
  const seen = new Set<TabId>()
  if (Array.isArray(raw)) {
    for (const item of raw) if (isTabId(item)) seen.add(item)
  }
  for (const id of DEFAULT_TAB_ORDER) seen.add(id)
  return [...seen]
}

/** Lleva una pestaña a la posición `toIndex` (se ajusta al rango). Devuelve el mismo arreglo si no cambia. */
export function moveTab(order: readonly TabId[], id: TabId, toIndex: number): readonly TabId[] {
  const from = order.indexOf(id)
  if (from === -1) return order
  const to = Math.max(0, Math.min(order.length - 1, Math.trunc(toIndex)))
  if (to === from) return order
  const next = order.filter((t) => t !== id)
  next.splice(to, 0, id)
  return next
}

/** Mueve una pestaña `delta` lugares (negativo = a la izquierda). */
export function shiftTab(order: readonly TabId[], id: TabId, delta: number): readonly TabId[] {
  const from = order.indexOf(id)
  return from === -1 ? order : moveTab(order, id, from + delta)
}

export const isDefaultTabOrder = (order: readonly TabId[]): boolean =>
  order.length === DEFAULT_TAB_ORDER.length && order.every((id, i) => id === DEFAULT_TAB_ORDER[i])
