import {
  DEFAULT_BUDGET_SETTINGS,
  isNovemberIso,
  nextExpenseId,
  normalizeDraft,
  sanitizeBudgetSettings,
  sanitizeExpenses,
  type BudgetSettings,
  type Expense,
  type ExpenseDraft,
} from './expenses'
import { isMoney, MAX_AMOUNT, roundCents, type Money } from './money'
import { isTransportMode } from './transport'
import type { TransportMode } from './trip'

/**
 * Lo que el usuario registra: estado de cada reserva, su enlace, el medio usado, lo que pagó de verdad,
 * la fecha real, sus gastos del día a día y su presupuesto.
 */
export const BOOKING_STATUSES = ['Por reservar', 'Reservado', 'Pagado'] as const
export type BookingStatus = (typeof BOOKING_STATUSES)[number]

export interface BookingState {
  readonly estado: Readonly<Record<string, BookingStatus>>
  readonly links: Readonly<Record<string, string>>
  /** Medio de transporte realmente usado en cada tramo (solo los que difieren del plan o se confirmaron). */
  readonly modes: Readonly<Record<string, TransportMode>>
  /** Importe realmente pagado por cada reserva, en la moneda en que se pagó. */
  readonly paid: Readonly<Record<string, Money>>
  /** Fecha real (ISO, noviembre de 2026) de cada reserva confirmada. */
  readonly dates: Readonly<Record<string, string>>
  readonly expenses: readonly Expense[]
  readonly budget: BudgetSettings
  /** Marca de tiempo (ms) de la última modificación local; sirve para resolver conflictos. */
  readonly t: number
}

export const EMPTY_BOOKING_STATE: BookingState = {
  estado: {},
  links: {},
  modes: {},
  paid: {},
  dates: {},
  expenses: [],
  budget: DEFAULT_BUDGET_SETTINGS,
  t: 0,
}

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
  const paid: Record<string, Money> = {}
  if (typeof obj.paid === 'object' && obj.paid !== null) {
    for (const [k, v] of Object.entries(obj.paid)) {
      if (isMoney(v)) paid[k] = { amount: roundCents(v.amount), currency: v.currency }
    }
  }
  const dates: Record<string, string> = {}
  if (typeof obj.dates === 'object' && obj.dates !== null) {
    for (const [k, v] of Object.entries(obj.dates)) if (isNovemberIso(v)) dates[k] = v
  }
  const t = typeof obj.t === 'number' && Number.isFinite(obj.t) ? obj.t : 0
  return {
    estado,
    links,
    modes,
    paid,
    dates,
    expenses: sanitizeExpenses(obj.expenses),
    budget: sanitizeBudgetSettings(obj.budget),
    t,
  }
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

/**
 * Registra (o borra con `null`) lo realmente pagado por una reserva. Un importe válido marca la
 * reserva como pagada. Devuelve `null` si el importe no es válido.
 */
export function setPaid(
  state: BookingState,
  key: string,
  money: Money | null,
  now: number,
): BookingState | null {
  const paid = { ...state.paid }
  let estado = state.estado
  if (money === null) {
    delete paid[key]
  } else {
    if (!isMoney(money)) return null
    paid[key] = { amount: roundCents(money.amount), currency: money.currency }
    if (statusOf(state, key) !== 'Pagado') estado = { ...estado, [key]: 'Pagado' }
  }
  return { ...state, paid, estado, t: now }
}

/**
 * Registra (o borra con `null`) la fecha real de una reserva. Una fecha confirma que ya se reservó.
 * Devuelve `null` si la fecha no es de noviembre de 2026.
 */
export function setRealDate(
  state: BookingState,
  key: string,
  iso: string | null,
  now: number,
): BookingState | null {
  const dates = { ...state.dates }
  let estado = state.estado
  if (iso === null) {
    delete dates[key]
  } else {
    if (!isNovemberIso(iso)) return null
    dates[key] = iso
    if (statusOf(state, key) === 'Por reservar') estado = { ...estado, [key]: 'Reservado' }
  }
  return { ...state, dates, estado, t: now }
}

export function addExpense(
  state: BookingState,
  draft: ExpenseDraft,
  now: number,
): { state: BookingState; expense: Expense } | null {
  const clean = normalizeDraft(draft)
  if (!clean) return null
  const expense: Expense = { id: nextExpenseId(state.expenses, now), ...clean }
  return { state: { ...state, expenses: [...state.expenses, expense], t: now }, expense }
}

export function updateExpense(
  state: BookingState,
  id: string,
  draft: ExpenseDraft,
  now: number,
): BookingState | null {
  const clean = normalizeDraft(draft)
  if (!clean || !state.expenses.some((e) => e.id === id)) return null
  const expenses = state.expenses.map((e) => (e.id === id ? { id, ...clean } : e))
  return { ...state, expenses, t: now }
}

export function removeExpense(state: BookingState, id: string, now: number): BookingState {
  return { ...state, expenses: state.expenses.filter((e) => e.id !== id), t: now }
}

/** Cambia el presupuesto total o el tope diario (`null` vuelve al valor sugerido). */
export function setBudgetField(
  state: BookingState,
  field: keyof BudgetSettings,
  value: number | null,
  now: number,
): BookingState | null {
  if (value !== null && !(Number.isFinite(value) && value > 0 && value <= MAX_AMOUNT)) return null
  const budget = { ...state.budget, [field]: value === null ? null : roundCents(value) }
  return { ...state, budget, t: now }
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
    Object.keys(local.modes).length > 0 ||
    Object.keys(local.paid).length > 0 ||
    Object.keys(local.dates).length > 0 ||
    local.expenses.length > 0 ||
    local.budget.total !== null ||
    local.budget.dailyCap !== null
  if (!remote || remote.t === 0) return hasLocal ? 'push-local' : 'none'
  if (remote.t > local.t) return 'adopt-remote'
  if (remote.t < local.t) return 'push-local'
  return 'none'
}
