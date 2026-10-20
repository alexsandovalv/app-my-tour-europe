import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { BookingStore, PreferencesStore } from '../src/application/ports'
import { EMPTY_BOOKING_STATE, type BookingState } from '../src/domain/booking'
import type { ThemePrefs } from '../src/domain/preferences'
import { connectBookingSync, createAppStore } from '../src/presentation/state/appStore'

class FakeBookings implements BookingStore {
  saved: BookingState[] = []
  private listener: ((s: BookingState) => void) | null = null
  constructor(private initial: BookingState = EMPTY_BOOKING_STATE) {}
  load = () => this.initial
  save = (s: BookingState) => void this.saved.push(s)
  subscribe = (l: (s: BookingState) => void) => {
    this.listener = l
    return () => (this.listener = null)
  }
  remote(s: BookingState) {
    this.listener?.(s)
  }
}

class FakePrefs implements PreferencesStore {
  saved: ThemePrefs[] = []
  constructor(private initial: ThemePrefs | null = null) {}
  load = () => this.initial
  save = (p: ThemePrefs) => void this.saved.push(p)
}

function setup(
  opts: { booking?: BookingState; prefs?: ThemePrefs | null; dark?: boolean; now?: number } = {},
) {
  const bookings = new FakeBookings(opts.booking)
  const preferences = new FakePrefs(opts.prefs ?? null)
  const store = createAppStore({
    bookings,
    preferences,
    firstDay: 3,
    clock: () => opts.now ?? 100,
    systemPrefersDark: () => opts.dark ?? false,
  })
  connectBookingSync(store, bookings)
  return { store, bookings, preferences }
}

describe('store de Zustand: navegación', () => {
  it('parte en el mapa y el día 3, y cambia de pestaña y de ciudad', () => {
    const { store } = setup()
    assert.equal(store.getState().tab, 'map')
    assert.equal(store.getState().selectedDay, 3)
    store.getState().setTab('age')
    store.getState().openCity('vigo')
    store.getState().selectDay(7)
    store.getState().setAgendaView('lista')
    const s = store.getState()
    assert.deepEqual(
      [s.tab, s.openCityId, s.selectedDay, s.agendaView],
      ['age', 'vigo', 7, 'lista'],
    )
    store.getState().closeCity()
    assert.equal(store.getState().openCityId, null)
  })

  it('notifica a los suscriptores solo cuando cambia el estado', () => {
    const { store } = setup()
    let calls = 0
    store.subscribe(() => calls++)
    store.getState().setTab('cal')
    assert.equal(calls, 1)
  })
})

describe('store de Zustand: tema', () => {
  it('usa el tema guardado o el de sistema por defecto', () => {
    assert.deepEqual(setup().store.getState().theme, { mode: 'system', accent: 'esmeralda' })
    const saved: ThemePrefs = { mode: 'dark', accent: 'azul' }
    assert.deepEqual(setup({ prefs: saved }).store.getState().theme, saved)
  })

  it('el botón día/noche alterna lo que se ve, incluso desde "sistema"', () => {
    const light = setup({ dark: false })
    light.store.getState().toggleDark()
    assert.equal(light.store.getState().theme.mode, 'dark')
    light.store.getState().toggleDark()
    assert.equal(light.store.getState().theme.mode, 'light')

    const night = setup({ dark: true }) // sistema oscuro: lo visible es oscuro, así que pasa a claro
    night.store.getState().toggleDark()
    assert.equal(night.store.getState().theme.mode, 'light')
  })

  it('persiste cada cambio de modo y de acento', () => {
    const { store, preferences } = setup()
    store.getState().setThemeMode('dark')
    store.getState().setAccent('terracota')
    assert.deepEqual(preferences.saved.at(-1), { mode: 'dark', accent: 'terracota' })
    assert.equal(preferences.saved.length, 2)
  })
})

describe('store de Zustand: reservas', () => {
  it('cambia estado, guarda y marca la hora', () => {
    const { store, bookings } = setup({ now: 100 })
    store.getState().cycleStatus('t-1')
    assert.equal(store.getState().booking.estado['t-1'], 'Reservado')
    assert.equal(store.getState().booking.t, 100)
    assert.equal(bookings.saved.length, 1)
  })

  it('rechaza enlaces inválidos y permite borrarlos', () => {
    const { store } = setup({ now: 1 })
    assert.equal(store.getState().setLink('t-1', 'hola'), false)
    assert.equal(store.getState().setLink('t-1', ' https://renfe.com/r/1 '), true)
    assert.equal(store.getState().booking.links['t-1'], 'https://renfe.com/r/1')
    store.getState().clearLink('t-1')
    assert.equal('t-1' in store.getState().booking.links, false)
  })

  it('registra el medio de transporte usado y lo guarda', () => {
    const { store, bookings } = setup({ now: 5 })
    store.getState().setTransportMode('t-1', 'air')
    assert.equal(store.getState().booking.modes['t-1'], 'air')
    assert.equal(bookings.saved.at(-1)?.modes['t-1'], 'air')
  })

  it('adopta un remoto más nuevo y conserva lo local si es más nuevo', () => {
    const local: BookingState = {
      ...EMPTY_BOOKING_STATE,
      estado: { a: 'Reservado' },
      links: {},
      modes: {},
      t: 50,
    }
    const { store, bookings } = setup({ booking: local })
    bookings.remote({
      ...EMPTY_BOOKING_STATE,
      estado: { a: 'Pagado' },
      links: {},
      modes: {},
      t: 40,
    })
    assert.equal(store.getState().booking.estado.a, 'Reservado')
    assert.equal(bookings.saved.at(-1)?.t, 50) // reenvía lo local
    bookings.remote({
      ...EMPTY_BOOKING_STATE,
      estado: { a: 'Pagado' },
      links: {},
      modes: { 't-4': 'bus' },
      t: 70,
    })
    assert.equal(store.getState().booking.estado.a, 'Pagado')
    assert.equal(store.getState().booking.modes['t-4'], 'bus')
    assert.equal(bookings.saved.at(-1)?.t, 70) // lo adoptado queda guardado en local
  })
})

describe('store de Zustand: pagos, fechas, gastos y presupuesto', () => {
  const draft = {
    date: '2026-11-08',
    category: 'comida' as const,
    description: 'Menú',
    amount: 12,
    currency: 'USD' as const,
  }

  it('guarda el importe pagado y la fecha real, y marca la reserva', () => {
    const { store, bookings } = setup({ now: 50 })
    assert.equal(store.getState().setPaid('t-1', { amount: 30, currency: 'EUR' }), true)
    assert.equal(store.getState().setRealDate('t-1', '2026-11-07'), true)
    const b = store.getState().booking
    assert.deepEqual(b.paid['t-1'], { amount: 30, currency: 'EUR' })
    assert.equal(b.dates['t-1'], '2026-11-07')
    assert.equal(b.estado['t-1'], 'Pagado')
    assert.equal(bookings.saved.at(-1)?.t, 50)
    assert.equal(store.getState().setPaid('t-1', { amount: -1, currency: 'USD' }), false)
    assert.equal(store.getState().setRealDate('t-1', '2026-12-25'), false)
    assert.deepEqual(store.getState().booking.paid['t-1'], { amount: 30, currency: 'EUR' })
  })

  it('agrega, edita y borra gastos y lo persiste', () => {
    const { store, bookings } = setup()
    const e = store.getState().addExpense(draft)
    assert.ok(e)
    assert.equal(store.getState().addExpense({ ...draft, amount: 0 }), null)
    assert.equal(store.getState().updateExpense(e.id, { ...draft, amount: 20 }), true)
    assert.equal(store.getState().booking.expenses[0]?.amount, 20)
    store.getState().removeExpense(e.id)
    assert.equal(store.getState().booking.expenses.length, 0)
    assert.ok((bookings.saved.length ?? 0) >= 3)
  })

  it('cambia el presupuesto total y el tope diario', () => {
    const { store } = setup()
    assert.equal(store.getState().setBudget('total', 4200), true)
    assert.equal(store.getState().setBudget('dailyCap', 55), true)
    assert.deepEqual(store.getState().booking.budget, { total: 4200, dailyCap: 55 })
    assert.equal(store.getState().setBudget('total', -1), false)
    assert.equal(store.getState().setBudget('total', null), true)
    assert.equal(store.getState().booking.budget.total, null)
  })
})
