import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { loadTrip } from '../src/application/loadTrip'
import { agendaProgress, dayProgress, eventKeys, eventsOfDay } from '../src/domain/agenda'
import {
  EMPTY_BOOKING_STATE,
  isDone,
  sanitizeBookingState,
  setDone,
  setDoneMany,
  setRealDate,
  decideSync,
  type BookingState,
} from '../src/domain/booking'
import { staticTripSource } from '../src/infrastructure/data/tripData'
import { staticRateProvider } from '../src/infrastructure/fx/ecbRate'

const trip = loadTrip(staticTripSource, staticRateProvider)
const must = <T>(v: T | null): T => {
  assert.ok(v !== null)
  return v
}

describe('marcas de «Hecho»', () => {
  it('marca, desmarca y varias a la vez, sin tocar lo demás', () => {
    const a = setDone(EMPTY_BOOKING_STATE, 'e-1', true, 5)
    assert.equal(isDone(a, 'e-1'), true)
    assert.equal(a.t, 5)
    const b = setDoneMany(a, ['t-1', 't-2'], true, 6)
    assert.deepEqual(Object.keys(b.done).sort(), ['e-1', 't-1', 't-2'])
    const c = setDoneMany(b, ['t-1', 'e-1'], false, 7)
    assert.deepEqual(Object.keys(c.done), ['t-2'])
    assert.deepEqual(c.expenses, [])
  })

  it('sanea marcas corruptas y respeta el límite', () => {
    const s = sanitizeBookingState({
      done: { a: true, b: false, c: 'sí', '': true, [`x${'y'.repeat(200)}`]: true },
    })
    assert.deepEqual(s.done, { a: true })
    const many = Object.fromEntries(Array.from({ length: 1500 }, (_, i) => [`k${i}`, true]))
    assert.equal(Object.keys(sanitizeBookingState({ done: many }).done).length, 1000)
    // datos guardados antes de existir `done` siguen siendo válidos
    assert.deepEqual(sanitizeBookingState({ estado: { a: 'Pagado' } }).done, {})
  })

  it('una marca local cuenta como dato propio al sincronizar', () => {
    const local: BookingState = { ...EMPTY_BOOKING_STATE, done: { x: true } }
    assert.equal(decideSync(local, null), 'push-local')
  })
})

describe('claves de los eventos de la agenda', () => {
  it('son únicas en todo el plan y un traslado usa el id del traslado', () => {
    const keys = eventKeys(trip)
    assert.equal(keys.length, trip.agenda.length)
    assert.equal(new Set(keys).size, keys.length)
    trip.agenda.forEach((e, i) => {
      if (e.transferId) assert.equal(keys[i], e.transferId)
    })
  })

  it('cada evento del día trae su clave, también si se movió por una fecha real', () => {
    for (let d = 1; d <= 30; d++) {
      assert.ok(eventsOfDay(trip, d).every((e) => typeof e.key === 'string'))
    }
    const s = must(setRealDate(EMPTY_BOOKING_STATE, 't-1', '2026-11-07', 1))
    assert.equal(eventsOfDay(trip, 7, s).find((e) => e.transferId === 't-1')?.key, 't-1')
  })

  it('una entrada o check-in con fecha real se marca con el id de la reserva', () => {
    let s = must(setRealDate(EMPTY_BOOKING_STATE, 'e-1', '2026-11-12', 1))
    s = must(setRealDate(s, 'h-vgo', '2026-11-06', 2))
    assert.ok(eventsOfDay(trip, 12, s).some((e) => e.key === 'e-1'))
    assert.ok(eventsOfDay(trip, 6, s).some((e) => e.key === 'h-vgo'))
  })
})

describe('progreso', () => {
  it('cuenta las actividades hechas de un día y del mes', () => {
    const day = Array.from({ length: 30 }, (_, i) => i + 1).find(
      (d) => eventsOfDay(trip, d).length >= 3,
    )
    assert.ok(day !== undefined)
    const events = eventsOfDay(trip, day)
    const first = events[0]?.key ?? ''
    const s = setDone(EMPTY_BOOKING_STATE, first, true, 1)
    assert.deepEqual(dayProgress(trip, s, day), { done: 1, total: events.length })
    assert.deepEqual(dayProgress(trip, EMPTY_BOOKING_STATE, day), { done: 0, total: events.length })
    const all = setDoneMany(
      s,
      events.map((e) => e.key ?? ''),
      true,
      2,
    )
    assert.equal(dayProgress(trip, all, day).done, events.length)
    const month = agendaProgress(trip, all)
    assert.equal(month.done, events.length)
    assert.ok(month.total >= 35)
  })

  it('una marca de otro día o desconocida no cuenta', () => {
    const s = setDone(EMPTY_BOOKING_STATE, 'no-existe', true, 1)
    assert.equal(agendaProgress(trip, s).done, 0)
  })
})
