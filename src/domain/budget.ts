/**
 * Presupuesto del viaje frente a lo realmente gastado. Todo en dólares.
 *
 * - Hospedaje y transporte: el presupuesto es el estimado del plan (punto medio de cada rango).
 * - El resto del total se reparte entre entradas, comida, transporte local, souvenirs e imprevistos.
 * - Una reserva con importe pagado cuenta por lo pagado; las que no tienen importe cuentan por su
 *   estimado en la columna «Por pagar».
 */
import type { BookingState } from './booking'
import { dayOfIso, EXPENSE_CATEGORIES, EXPENSE_LABEL, type ExpenseCategory } from './expenses'
import { roundCents, usdOf, type ExchangeRate } from './money'
import { stayTotal } from './summary'
import type { Trip } from './trip'

export const BUDGET_CATEGORIES = [
  'transporte',
  'hospedaje',
  'entradas',
  ...EXPENSE_CATEGORIES,
] as const
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number]

export const BUDGET_LABEL: Record<BudgetCategory, string> = {
  transporte: 'Trenes, vuelos y buses',
  hospedaje: 'Hospedaje',
  entradas: 'Entradas y tours',
  ...EXPENSE_LABEL,
}

/** Gasto previsto al día para entradas y gastos del día a día; con él se sugiere el total. */
export const DAILY_ALLOWANCE = 70

/** Cómo se reparte lo que queda del total tras hospedaje y transporte. */
export const POOL_SHARE: Record<Exclude<BudgetCategory, 'transporte' | 'hospedaje'>, number> = {
  entradas: 0.2,
  comida: 0.4,
  local: 0.15,
  souvenirs: 0.1,
  imprevistos: 0.15,
}

export interface CategoryRow {
  readonly category: BudgetCategory
  readonly label: string
  readonly budget: number
  readonly real: number
  /** Estimado de lo que aún no tiene importe pagado (solo hospedaje y transporte). */
  readonly pending: number
  /** Presupuestado − real − por pagar: positivo sobra, negativo falta. */
  readonly difference: number
}

export interface DayPoint {
  readonly day: number
  readonly spent: number
  readonly over: boolean
}

export interface BudgetReport {
  readonly tripDays: number
  readonly suggestedTotal: number
  readonly total: number
  readonly totalIsCustom: boolean
  readonly suggestedDailyCap: number
  readonly dailyCap: number
  readonly dailyCapIsCustom: boolean
  readonly rows: readonly CategoryRow[]
  readonly spent: number
  readonly pending: number
  /** Real + por pagar. */
  readonly projected: number
  readonly remaining: number
  readonly projectedRemaining: number
  readonly usedRatio: number
  readonly dailyExpenses: number
  readonly daysWithExpenses: number
  readonly averageDaily: number
  readonly daily: readonly DayPoint[]
  readonly overDays: readonly DayPoint[]
}

const mid = (low: number, high: number): number => (low + high) / 2
const roundTo = (n: number, step: number): number => Math.round(n / step) * step

export function computeBudget(trip: Trip, state: BookingState, fx: ExchangeRate): BudgetReport {
  const tripDays = trip.lastDay - trip.firstDay + 1

  // Estimados del plan y lo realmente pagado, por reserva.
  const lodging = trip.stays.map((s) => ({
    key: s.id,
    estimate: mid(stayTotal(s).low, stayTotal(s).high),
  }))
  const transport = trip.transfers.map((t) => ({
    key: t.id,
    estimate: mid(t.price.low, t.price.high),
  }))
  const paidOf = (key: string): number | null => {
    const m = state.paid[key]
    return m ? usdOf(m, fx) : null
  }
  const planOf = (items: readonly { estimate: number }[]) =>
    items.reduce((acc, i) => acc + i.estimate, 0)
  const realOf = (items: readonly { key: string }[]) =>
    items.reduce((acc, i) => acc + (paidOf(i.key) ?? 0), 0)
  const pendingOf = (items: readonly { key: string; estimate: number }[]) =>
    items.reduce((acc, i) => acc + (paidOf(i.key) === null ? i.estimate : 0), 0)

  const lodgingPlan = planOf(lodging)
  const transportPlan = planOf(transport)
  const bookingsPlan = lodgingPlan + transportPlan

  const suggestedTotal = roundTo(bookingsPlan + DAILY_ALLOWANCE * tripDays, 50)
  const customTotal = state.budget.total
  const total = customTotal ?? suggestedTotal

  // Si el total es menor que el plan de reservas, esas partidas se reducen en proporción.
  const scale = bookingsPlan > 0 ? Math.min(1, total / bookingsPlan) : 1
  const lodgingBudget = Math.round(lodgingPlan * scale)
  const transportBudget = Math.round(transportPlan * scale)
  const pool = Math.max(0, total - lodgingBudget - transportBudget)
  const entradasBudget = Math.round(pool * POOL_SHARE.entradas)
  const comidaBudget = Math.round(pool * POOL_SHARE.comida)
  const localBudget = Math.round(pool * POOL_SHARE.local)
  const souvenirsBudget = Math.round(pool * POOL_SHARE.souvenirs)
  // El resto va a imprevistos para que las partidas sumen exactamente el total.
  const imprevistosBudget = Math.max(
    0,
    total -
      lodgingBudget -
      transportBudget -
      entradasBudget -
      comidaBudget -
      localBudget -
      souvenirsBudget,
  )
  const budgets: Record<BudgetCategory, number> = {
    transporte: transportBudget,
    hospedaje: lodgingBudget,
    entradas: entradasBudget,
    comida: comidaBudget,
    local: localBudget,
    souvenirs: souvenirsBudget,
    imprevistos: imprevistosBudget,
  }

  // Gastos del día a día.
  const expenseUsd = (amount: number, currency: 'USD' | 'EUR') => usdOf({ amount, currency }, fx)
  const byCategory: Record<ExpenseCategory, number> = {
    comida: 0,
    local: 0,
    souvenirs: 0,
    imprevistos: 0,
  }
  const perDay = new Map<number, number>()
  const datesWithExpenses = new Set<string>()
  for (const e of state.expenses) {
    const usd = expenseUsd(e.amount, e.currency)
    byCategory[e.category] += usd
    datesWithExpenses.add(e.date)
    perDay.set(dayOfIso(e.date), (perDay.get(dayOfIso(e.date)) ?? 0) + usd)
  }
  const dailyExpenses = roundCents(Object.values(byCategory).reduce((a, b) => a + b, 0))

  const tickets = trip.tickets.map((t) => ({ key: t.id }))
  const real: Record<BudgetCategory, number> = {
    transporte: realOf(transport),
    hospedaje: realOf(lodging),
    entradas: realOf(tickets),
    comida: byCategory.comida,
    local: byCategory.local,
    souvenirs: byCategory.souvenirs,
    imprevistos: byCategory.imprevistos,
  }
  const pending: Record<BudgetCategory, number> = {
    transporte: Math.round(pendingOf(transport)),
    hospedaje: Math.round(pendingOf(lodging)),
    entradas: 0,
    comida: 0,
    local: 0,
    souvenirs: 0,
    imprevistos: 0,
  }

  const rows = BUDGET_CATEGORIES.map((category): CategoryRow => {
    const r = roundCents(real[category])
    return {
      category,
      label: BUDGET_LABEL[category],
      budget: budgets[category],
      real: r,
      pending: pending[category],
      difference: roundCents(budgets[category] - r - pending[category]),
    }
  })

  const spent = roundCents(rows.reduce((acc, r) => acc + r.real, 0))
  const pendingTotal = rows.reduce((acc, r) => acc + r.pending, 0)

  // Tope diario: lo presupuestado para el día a día repartido entre los días del viaje.
  const suggestedDailyCap = Math.max(
    1,
    Math.round((comidaBudget + localBudget + souvenirsBudget + imprevistosBudget) / tripDays),
  )
  const dailyCap = state.budget.dailyCap ?? suggestedDailyCap
  const daily = Array.from({ length: tripDays }, (_, i): DayPoint => {
    const day = trip.firstDay + i
    const sum = roundCents(perDay.get(day) ?? 0)
    return { day, spent: sum, over: sum > dailyCap }
  })

  return {
    tripDays,
    suggestedTotal,
    total,
    totalIsCustom: customTotal !== null,
    suggestedDailyCap,
    dailyCap,
    dailyCapIsCustom: state.budget.dailyCap !== null,
    rows,
    spent,
    pending: pendingTotal,
    projected: roundCents(spent + pendingTotal),
    remaining: roundCents(total - spent),
    projectedRemaining: roundCents(total - spent - pendingTotal),
    usedRatio: total > 0 ? spent / total : 0,
    dailyExpenses,
    daysWithExpenses: datesWithExpenses.size,
    averageDaily:
      datesWithExpenses.size > 0 ? roundCents(dailyExpenses / datesWithExpenses.size) : 0,
    daily,
    overDays: daily.filter((d) => d.over),
  }
}
