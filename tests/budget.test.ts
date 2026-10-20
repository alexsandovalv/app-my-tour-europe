import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadTrip } from '../src/application/loadTrip'
import { confirmedItems, eventsOfDay } from '../src/domain/agenda'
import {
  addExpense,
  EMPTY_BOOKING_STATE,
  removeExpense,
  sanitizeBookingState,
  setBudgetField,
  setPaid,
  setRealDate,
  statusOf,
  updateExpense,
  type BookingState,
} from '../src/domain/booking'
import { computeBudget, DAILY_ALLOWANCE } from '../src/domain/budget'
import { dayOfIso, isNovemberIso, isoOfDay, normalizeDraft } from '../src/domain/expenses'
import { formatUsd, usdOf } from '../src/domain/money'
import { staticTripSource } from '../src/infrastructure/data/tripData'
import { ECB_RATE, staticRateProvider } from '../src/infrastructure/fx/ecbRate'

const trip = loadTrip(staticTripSource, staticRateProvider)
const fx = ECB_RATE
const draft = (over: Partial<Parameters<typeof normalizeDraft>[0]> = {}) => ({
  date: '2026-11-08',
  category: 'comida' as const,
  description: 'Menú del día',
  amount: 12.5,
  currency: 'USD' as const,
  ...over,
})
const must = <T>(v: T | null): T => {
  assert.ok(v !== null, 'se esperaba un valor')
  return v
}

describe('dinero y fechas propias', () => {
  it('convierte euros a dólares con el cambio de referencia y conserva centavos', () => {
    assert.equal(usdOf({ amount: 100, currency: 'USD' }, fx), 100)
    assert.equal(usdOf({ amount: 10, currency: 'EUR' }, fx), 11.23)
    assert.equal(formatUsd(1234), 'US$1,234')
    assert.equal(formatUsd(12.5), 'US$12.50')
  })

  it('solo acepta fechas de noviembre de 2026', () => {
    assert.equal(isNovemberIso('2026-11-30'), true)
    assert.equal(isNovemberIso('2026-12-01'), false)
    assert.equal(isNovemberIso('2026-11-31'), false)
    assert.equal(isNovemberIso('2026-10-31'), false)
    assert.equal(dayOfIso('2026-11-07'), 7)
    assert.equal(isoOfDay(7), '2026-11-07')
  })
})

describe('pagos y fechas reales de las reservas', () => {
  it('un importe pagado marca la reserva como pagada y se puede borrar', () => {
    const s = must(setPaid(EMPTY_BOOKING_STATE, 't-1', { amount: 30, currency: 'EUR' }, 5))
    assert.deepEqual(s.paid, { 't-1': { amount: 30, currency: 'EUR' } })
    assert.equal(statusOf(s, 't-1'), 'Pagado')
    assert.equal(s.t, 5)
    const cleared = must(setPaid(s, 't-1', null, 6))
    assert.deepEqual(cleared.paid, {})
    assert.equal(statusOf(cleared, 't-1'), 'Pagado', 'borrar el importe no deshace el estado')
  })

  it('rechaza importes inválidos', () => {
    for (const amount of [0, -3, Number.NaN, Infinity, 5_000_000]) {
      assert.equal(setPaid(EMPTY_BOOKING_STATE, 'x', { amount, currency: 'USD' }, 1), null)
    }
  })

  it('una fecha real confirma la reserva y valida el mes', () => {
    const s = must(setRealDate(EMPTY_BOOKING_STATE, 't-1', '2026-11-07', 3))
    assert.equal(s.dates['t-1'], '2026-11-07')
    assert.equal(statusOf(s, 't-1'), 'Reservado')
    assert.equal(setRealDate(s, 't-1', '2026-12-01', 4), null)
    assert.deepEqual(must(setRealDate(s, 't-1', null, 5)).dates, {})
    const paid = must(setPaid(s, 't-1', { amount: 1, currency: 'USD' }, 6))
    assert.equal(statusOf(must(setRealDate(paid, 't-1', '2026-11-08', 7)), 't-1'), 'Pagado')
  })
})

describe('gastos del día a día', () => {
  it('agrega, edita y borra con ids únicos', () => {
    const a = must(addExpense(EMPTY_BOOKING_STATE, draft(), 10))
    const b = must(addExpense(a.state, draft({ category: 'local', amount: 3 }), 10))
    assert.notEqual(a.expense.id, b.expense.id)
    assert.equal(b.state.expenses.length, 2)
    const edited = must(updateExpense(b.state, a.expense.id, draft({ amount: 20 }), 11))
    assert.equal(edited.expenses[0]?.amount, 20)
    assert.equal(updateExpense(b.state, 'no-existe', draft(), 11), null)
    const left = removeExpense(edited, a.expense.id, 12)
    assert.deepEqual(
      left.expenses.map((e) => e.id),
      [b.expense.id],
    )
  })

  it('rechaza fechas fuera de noviembre, categorías raras e importes inválidos', () => {
    assert.equal(addExpense(EMPTY_BOOKING_STATE, draft({ date: '2026-12-02' }), 1), null)
    assert.equal(addExpense(EMPTY_BOOKING_STATE, draft({ amount: 0 }), 1), null)
    assert.equal(addExpense(EMPTY_BOOKING_STATE, draft({ category: 'otra' as never }), 1), null)
  })

  it('recorta la descripción y redondea a centavos', () => {
    const e = must(normalizeDraft(draft({ description: ` ${'x'.repeat(200)} `, amount: 1.006 })))
    assert.equal(e.description.length, 80)
    assert.equal(e.amount, 1.01)
  })
})

describe('sanea los datos nuevos', () => {
  it('descarta pagos, fechas, gastos y presupuesto corruptos', () => {
    const s = sanitizeBookingState({
      paid: { a: { amount: 10, currency: 'USD' }, b: { amount: -1, currency: 'USD' }, c: 'x' },
      dates: { a: '2026-11-05', b: '2027-01-01' },
      expenses: [
        {
          id: 'e1',
          date: '2026-11-05',
          category: 'comida',
          description: 'a',
          amount: 5,
          currency: 'EUR',
        },
        {
          id: 'e1',
          date: '2026-11-05',
          category: 'comida',
          description: 'dup',
          amount: 5,
          currency: 'EUR',
        },
        {
          id: 'e2',
          date: 'mañana',
          category: 'comida',
          description: 'b',
          amount: 5,
          currency: 'EUR',
        },
        42,
      ],
      budget: { total: 3000, dailyCap: -5 },
    })
    assert.deepEqual(s.paid, { a: { amount: 10, currency: 'USD' } })
    assert.deepEqual(s.dates, { a: '2026-11-05' })
    assert.deepEqual(
      s.expenses.map((e) => e.id),
      ['e1'],
    )
    assert.deepEqual(s.budget, { total: 3000, dailyCap: null })
  })

  it('el presupuesto acepta valores positivos o null para volver al sugerido', () => {
    const s = must(setBudgetField(EMPTY_BOOKING_STATE, 'total', 4000, 1))
    assert.equal(s.budget.total, 4000)
    assert.equal(must(setBudgetField(s, 'total', null, 2)).budget.total, null)
    assert.equal(setBudgetField(s, 'total', 0, 3), null)
    assert.equal(setBudgetField(s, 'dailyCap', Number.NaN, 3), null)
  })
})

describe('presupuesto contra lo real', () => {
  it('sugiere un total con las reservas del plan más el gasto previsto por día', () => {
    const r = computeBudget(trip, EMPTY_BOOKING_STATE, fx)
    assert.equal(r.tripDays, 25)
    assert.equal(r.total, r.suggestedTotal)
    assert.equal(r.totalIsCustom, false)
    const plan = r.rows.filter((x) => x.category === 'transporte' || x.category === 'hospedaje')
    const planSum = plan.reduce((a, x) => a + x.budget, 0)
    assert.ok(
      Math.abs(r.total - (planSum + DAILY_ALLOWANCE * 25)) <= 50,
      'total ≈ plan + gasto diario',
    )
    assert.equal(r.spent, 0)
    assert.equal(r.remaining, r.total)
  })

  it('las partidas suman exactamente el total, también con un total propio', () => {
    for (const total of [undefined, 1500, 3333, 9000]) {
      const state: BookingState = {
        ...EMPTY_BOOKING_STATE,
        budget: { total: total ?? null, dailyCap: null },
      }
      const r = computeBudget(trip, state, fx)
      assert.equal(
        r.rows.reduce((a, x) => a + x.budget, 0),
        r.total,
        `total ${String(total)}`,
      )
      assert.ok(r.rows.every((x) => x.budget >= 0))
    }
  })

  it('lo pagado reemplaza al estimado y sale de «por pagar»', () => {
    const before = computeBudget(trip, EMPTY_BOOKING_STATE, fx)
    const t1 = before.rows.find((x) => x.category === 'transporte')
    assert.ok(t1 && t1.pending > 0 && t1.real === 0)
    const paid = must(setPaid(EMPTY_BOOKING_STATE, 't-1', { amount: 40, currency: 'USD' }, 1))
    const after = computeBudget(trip, paid, fx)
    const t2 = after.rows.find((x) => x.category === 'transporte')
    assert.ok(t2)
    assert.equal(t2.real, 40)
    assert.ok(t2.pending < t1.pending)
    assert.equal(after.spent, 40)
    assert.equal(after.projected, 40 + after.pending)
  })

  it('un pago en euros se convierte; los gastos suman por categoría y por día', () => {
    let s: BookingState = must(
      setPaid(EMPTY_BOOKING_STATE, 'e-1', { amount: 20, currency: 'EUR' }, 1),
    )
    s = must(addExpense(s, draft({ amount: 30 }), 2)).state
    s = must(addExpense(s, draft({ category: 'local', amount: 10, currency: 'EUR' }), 3)).state
    s = must(addExpense(s, draft({ date: '2026-11-09', amount: 15 }), 4)).state
    const r = computeBudget(trip, s, fx)
    const row = (c: string) => r.rows.find((x) => x.category === c)
    assert.equal(row('entradas')?.real, 22.45)
    assert.equal(row('comida')?.real, 45)
    assert.equal(row('local')?.real, 11.23)
    assert.equal(r.dailyExpenses, 56.23)
    assert.equal(r.daysWithExpenses, 2)
    assert.equal(r.averageDaily, 28.12)
    assert.equal(r.daily.find((d) => d.day === 8)?.spent, 41.23)
    assert.equal(r.daily.length, 25)
    assert.equal(r.spent, 78.68)
  })

  it('marca los días que pasan el tope diario, sugerido o propio', () => {
    let s = must(addExpense(EMPTY_BOOKING_STATE, draft({ amount: 500 }), 1)).state
    const r = computeBudget(trip, s, fx)
    assert.ok(r.suggestedDailyCap > 20)
    assert.deepEqual(
      r.overDays.map((d) => d.day),
      [8],
    )
    s = must(setBudgetField(s, 'dailyCap', 600, 2))
    const r2 = computeBudget(trip, s, fx)
    assert.equal(r2.dailyCap, 600)
    assert.equal(r2.dailyCapIsCustom, true)
    assert.equal(r2.overDays.length, 0)
  })

  it('la diferencia es presupuestado − real − por pagar', () => {
    const r = computeBudget(trip, EMPTY_BOOKING_STATE, fx)
    for (const x of r.rows) assert.equal(x.difference, x.budget - x.real - x.pending)
  })
})

describe('agenda y calendario con la fecha real', () => {
  it('un traslado con fecha real cambia de día en la agenda', () => {
    const s = must(setRealDate(EMPTY_BOOKING_STATE, 't-1', '2026-11-07', 1))
    assert.ok(eventsOfDay(trip, 6, s).every((e) => e.transferId !== 't-1'))
    const moved = eventsOfDay(trip, 7, s).find((e) => e.transferId === 't-1')
    assert.ok(moved)
    assert.match(moved.note, /Fecha confirmada/)
    // sin fecha real todo queda como el plan
    assert.ok(eventsOfDay(trip, 6).some((e) => e.transferId === 't-1'))
  })

  it('una entrada o un check-in con fecha real aparecen como eventos de ese día', () => {
    let s = must(setRealDate(EMPTY_BOOKING_STATE, 'e-1', '2026-11-12', 1))
    s = must(setRealDate(s, 'h-vgo', '2026-11-06', 2))
    assert.ok(eventsOfDay(trip, 12, s).some((e) => /^Entrada: /.test(e.title) && e.kind === 'res'))
    assert.ok(eventsOfDay(trip, 6, s).some((e) => /^Check-in: /.test(e.title)))
    const items = confirmedItems(trip, s)
    assert.deepEqual(items.map((i) => [i.key, i.day]).sort(), [
      ['e-1', 12],
      ['h-vgo', 6],
    ])
  })

  it('el medio elegido se refleja en el título de la reserva confirmada', () => {
    let s = must(setRealDate(EMPTY_BOOKING_STATE, 't-2', '2026-11-07', 1))
    s = { ...s, modes: { 't-2': 'bus' } }
    assert.ok(confirmedItems(trip, s).some((i) => i.key === 't-2' && /^Bus a /.test(i.title)))
  })
})
