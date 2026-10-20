import { isTransportMode } from './transport'
import type { TransportMode } from './trip'

/** Estado de las reservas del usuario: estado de cada ítem, el enlace de su reserva y el medio usado. */
export const BOOKING_STATUSES = ['Por reservar', 'Reservado', 'Pagado'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export interface BookingState {
  readonly estado: Readonly<Record<string, BookingStatus>>
  readonly links: Readonly<Record<string, string>>
  /** Medio de transporte realmente usado en cada tramo (solo los que difieren del plan o se confirmaron). */
  readonly modes: Readonly<Record<string, TransportMode>>
  /** Marca de tiempo (ms) de la última modificación local; sirve para resolver conflictos. */
  readonly t: number
}

export const EMPTY_BOOKING_STATE: BookingState = { estado: {}, links: {}, modes: {}, t: 0 }

export function statusOf(state: BookingState, key: string): BookingStatus {
  return state.estado[key] ?? 'Por reservar'
}

export function nextStatus(current: BookingStatus): BookingStatus {
  const i = BOOKING_STATUSES.indexOf(current)
  return BOOKING_STATUSES[(i + 1) % BOOKING_STATUSES.length] ?? 'Por reservar'
}

export function isValidBookingUrl(value: unknown): value is string {
  return typeof value === 'string' && /^https?:\/\/[^\s]+$/i.test(value)
}

function isStatus(value: unknown): value is BookingStatus {
  return (BOOKING_STATUSES as readonly unknown[]).includes(value)
}

/** Convierte datos externos (localStorage, base compartida) en un estado válido. */
export function sanitizeBookingState(raw: unknown): BookingState {
  if (typeof raw !== 'object' || raw === null) return EMPTY_BOOKING_STATE
  const obj = raw as Record<string, unknown>
  const estado: Record<string, BookingStatus> = {}
  const links: Record<string, string> = {}
  const modes: Record<string, TransportMode> = {}
  if (typeof obj.estado === 'object' && obj.estado !== null) {
    for (const [k, v] of Object.entries(obj.estado)) if (isStatus(v)) estado[k] = v
  }
  if (typeof obj.links === 'object' && obj.links !== null) {
    for (const [k, v] of Object.entries(obj.links)) if (isValidBookingUrl(v)) links[k] = v
  }
  if (typeof obj.modes === 'object' && obj.modes !== null) {
    for (const [k, v] of Object.entries(obj.modes)) if (isTransportMode(v)) modes[k] = v
  }
  const t = typeof obj.t === 'number' && Number.isFinite(obj.t) ? obj.t : 0
  return { estado, links, modes, t }
}

export function cycleStatus(state: BookingState, key: string, now: number): BookingState {
  return { ...state, estado: { ...state.estado, [key]: nextStatus(statusOf(state, key)) }, t: now }
}

export function setTransportMode(
  state: BookingState,
  key: string,
  mode: TransportMode,
  now: number,
): BookingState {
  return { ...state, modes: { ...state.modes, [key]: mode }, t: now }
}

export type LinkResult =
  | { readonly ok: true; readonly state: BookingState }
  | { readonly ok: false; readonly reason: 'invalid-url' }

/** Guarda, valida o borra (cadena vacía) el enlace de una reserva. */
export function updateLink(state: BookingState, key: string, raw: string, now: number): LinkResult {
  const value = raw.trim()
  const links = { ...state.links }
  if (value === '') {
    delete links[key]
  } else if (isValidBookingUrl(value)) {
    links[key] = value
  } else {
    return { ok: false, reason: 'invalid-url' }
  }
  return { ok: true, state: { ...state, links, t: now } }
}

/** Reservas ya avanzadas (reservado o pagado) entre las claves vigentes. */
export function progressOf(
  state: BookingState,
  keys: readonly string[],
): { done: number; total: number } {
  const done = keys.filter((k) => statusOf(state, k) !== 'Por reservar').length
  return { done, total: keys.length }
}

export type SyncDecision = 'adopt-remote' | 'push-local' | 'none'

/**
 * Decide qué hacer cuando llega una versión remota: gana la más reciente.
 * Un remoto sin datos solo se rellena si lo local tiene algo.
 */
export function decideSync(local: BookingState, remote: BookingState | null): SyncDecision {
  const hasLocal =
    local.t > 0 ||
    Object.keys(local.estado).length > 0 ||
    Object.keys(local.links).length > 0 ||
    Object.keys(local.modes).length > 0
  if (!remote || remote.t === 0) return hasLocal ? 'push-local' : 'none'
  if (remote.t > local.t) return 'adopt-remote'
  if (remote.t < local.t) return 'push-local'
  return 'none'
}
