/**
 * Gastos del día a día y fechas de noviembre de 2026.
 * Las reservas (hospedaje, traslados, entradas) no pasan por aquí: llevan su propio importe pagado.
 */
import { isMoney, MAX_AMOUNT, roundCents, type Currency } from './money'

export const EXPENSE_CATEGORIES = ['comida', 'local', 'souvenirs', 'imprevistos'] as const
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]

export const EXPENSE_LABEL: Record<ExpenseCategory, string> = {
  comida: 'Comida',
  local: 'Transporte local',
  souvenirs: 'Souvenirs',
  imprevistos: 'Imprevistos',
}

export interface Expense {
  readonly id: string
  /** Fecha ISO dentro de noviembre de 2026 (AAAA-MM-DD). */
  readonly date: string
  readonly category: ExpenseCategory
  readonly description: string
  readonly amount: number
  readonly currency: Currency
}

/** Lo que escribe el usuario en el formulario. */
export interface ExpenseDraft {
  readonly date: string
  readonly category: ExpenseCategory
  readonly description: string
  readonly amount: number
  readonly currency: Currency
}

export interface BudgetSettings {
  /** Presupuesto total en US$; `null` usa el sugerido. */
  readonly total: number | null
  /** Tope de gasto diario en US$; `null` usa el sugerido. */
  readonly dailyCap: number | null
}

export const DEFAULT_BUDGET_SETTINGS: BudgetSettings = { total: null, dailyCap: null }

const NOV_ISO = /^2026-11-(0[1-9]|[12]\d|30)$/

export function isNovemberIso(value: unknown): value is string {
  return typeof value === 'string' && NOV_ISO.test(value)
}

export const dayOfIso = (iso: string): number => Number(iso.slice(8, 10))

export const isoOfDay = (day: number): string => `2026-11-${String(day).padStart(2, '0')}`

export function isExpenseCategory(value: unknown): value is ExpenseCategory {
  return (EXPENSE_CATEGORIES as readonly unknown[]).includes(value)
}

const MAX_DESCRIPTION = 80

/** Valida el borrador del formulario; `null` si algún dato no sirve. */
export function normalizeDraft(draft: ExpenseDraft): ExpenseDraft | null {
  const description = draft.description.trim().slice(0, MAX_DESCRIPTION)
  if (!isNovemberIso(draft.date) || !isExpenseCategory(draft.category)) return null
  if (!isMoney({ amount: draft.amount, currency: draft.currency })) return null
  return {
    date: draft.date,
    category: draft.category,
    description,
    amount: roundCents(draft.amount),
    currency: draft.currency,
  }
}

function isExpense(value: unknown): value is Expense {
  if (typeof value !== 'object' || value === null) return false
  const e = value as Record<string, unknown>
  return (
    typeof e.id === 'string' &&
    e.id !== '' &&
    typeof e.description === 'string' &&
    isNovemberIso(e.date) &&
    isExpenseCategory(e.category) &&
    isMoney({ amount: e.amount, currency: e.currency })
  )
}

/** Datos externos → lista válida y sin ids repetidos. */
export function sanitizeExpenses(raw: unknown): readonly Expense[] {
  if (!Array.isArray(raw)) return []
  const seen = new Set<string>()
  const out: Expense[] = []
  for (const item of raw) {
    if (!isExpense(item) || seen.has(item.id)) continue
    seen.add(item.id)
    out.push({
      id: item.id,
      date: item.date,
      category: item.category,
      description: item.description.slice(0, MAX_DESCRIPTION),
      amount: roundCents(item.amount),
      currency: item.currency,
    })
  }
  return out
}

export function sanitizeBudgetSettings(raw: unknown): BudgetSettings {
  if (typeof raw !== 'object' || raw === null) return DEFAULT_BUDGET_SETTINGS
  const o = raw as Record<string, unknown>
  const valid = (v: unknown): number | null =>
    typeof v === 'number' && Number.isFinite(v) && v > 0 && v <= MAX_AMOUNT ? roundCents(v) : null
  return { total: valid(o.total), dailyCap: valid(o.dailyCap) }
}

/** Id nuevo que no choca con los existentes. */
export function nextExpenseId(existing: readonly Expense[], now: number): string {
  const used = new Set(existing.map((e) => e.id))
  let n = existing.length
  let id = `x-${now.toString(36)}-${n}`
  while (used.has(id)) id = `x-${now.toString(36)}-${++n}`
  return id
}
