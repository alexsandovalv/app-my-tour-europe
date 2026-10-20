import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { BookingService } from '../src/application/bookingService'
import type { BookingStore } from '../src/application/ports'
import {
  decideSync,
  EMPTY_BOOKING_STATE,
  isValidBookingUrl,
  nextStatus,
  progressOf,
  sanitizeBookingState,
  type BookingState,
} from '../src/domain/booking'
import { ClaudeDbSync } from '../src/infrastructure/storage/claudeDb'
import {
  LocalBookingCache,
  type KeyValueStorage,
} from '../src/infrastructure/storage/localStorageStore'
import { SyncedBookingStore } from '../src/infrastructure/storage/syncedBookingStore'

class FakeStore implements BookingStore {
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

describe('reglas de reservas', () => {
  it('el estado avanza en ciclo', () => {
    assert.equal(nextStatus('Por reservar'), 'Reservado')
    assert.equal(nextStatus('Reservado'), 'Pagado')
    assert.equal(nextStatus('Pagado'), 'Por reservar')
  })

  it('solo acepta enlaces http(s) completos', () => {
    assert.equal(isValidBookingUrl('https://booking.com/x?a=1'), true)
    assert.equal(isValidBookingUrl('booking.com'), false)
    assert.equal(isValidBookingUrl('https://a b'), false)
    assert.equal(isValidBookingUrl(undefined), false)
  })

  it('sanea datos externos corruptos', () => {
    const s = sanitizeBookingState({
      estado: { a: 'Pagado', b: 'xx' },
      links: { a: 'nope', b: 'https://x.io' },
      t: 'z',
    })
    assert.deepEqual(s, { estado: { a: 'Pagado' }, links: { b: 'https://x.io' }, t: 0 })
    assert.deepEqual(sanitizeBookingState(null), EMPTY_BOOKING_STATE)
  })

  it('gana la versión más reciente', () => {
    const a: BookingState = { estado: {}, links: {}, t: 10 }
    assert.equal(decideSync(a, { ...a, t: 20 }), 'adopt-remote')
    assert.equal(decideSync(a, { ...a, t: 5 }), 'push-local')
    assert.equal(decideSync(a, { ...a }), 'none')
    assert.equal(decideSync(a, null), 'push-local')
    assert.equal(decideSync(EMPTY_BOOKING_STATE, null), 'none')
  })

  it('cuenta el progreso solo sobre las claves vigentes', () => {
    const s: BookingState = { estado: { a: 'Reservado', viejo: 'Pagado' }, links: {}, t: 1 }
    assert.deepEqual(progressOf(s, ['a', 'b']), { done: 1, total: 2 })
  })
})

describe('BookingService', () => {
  it('cambia estado, guarda y notifica', () => {
    const store = new FakeStore()
    const svc = new BookingService(store, () => 100)
    let calls = 0
    svc.subscribe(() => calls++)
    svc.cycleStatus('t-1')
    assert.equal(svc.getSnapshot().estado['t-1'], 'Reservado')
    assert.equal(svc.getSnapshot().t, 100)
    assert.equal(store.saved.length, 1)
    assert.equal(calls, 1)
  })

  it('rechaza enlaces inválidos y permite borrarlos', () => {
    const svc = new BookingService(new FakeStore(), () => 1)
    assert.equal(svc.setLink('t-1', 'hola'), false)
    assert.equal(svc.setLink('t-1', ' https://renfe.com/r/1 '), true)
    assert.equal(svc.getSnapshot().links['t-1'], 'https://renfe.com/r/1')
    svc.clearLink('t-1')
    assert.equal('t-1' in svc.getSnapshot().links, false)
  })

  it('adopta un remoto más nuevo y conserva lo local si es más nuevo', () => {
    const store = new FakeStore({ estado: { a: 'Reservado' }, links: {}, t: 50 })
    const svc = new BookingService(store, () => 60)
    store.remote({ estado: { a: 'Pagado' }, links: {}, t: 40 })
    assert.equal(svc.getSnapshot().estado.a, 'Reservado')
    assert.equal(store.saved.at(-1)?.t, 50) // reenvía lo local
    store.remote({ estado: { a: 'Pagado' }, links: {}, t: 70 })
    assert.equal(svc.getSnapshot().estado.a, 'Pagado')
    assert.equal(store.saved.at(-1)?.t, 70) // lo adoptado queda guardado en local
  })
})

describe('almacenamiento', () => {
  it('sobrevive a un almacenamiento que falla', () => {
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {
        throw new Error('bloqueado')
      },
    }
    const cache = new LocalBookingCache(broken)
    assert.deepEqual(cache.load(), EMPTY_BOOKING_STATE)
    assert.doesNotThrow(() => cache.save(EMPTY_BOOKING_STATE))
    assert.deepEqual(new LocalBookingCache(null).load(), EMPTY_BOOKING_STATE)
  })

  it('guarda y recupera', () => {
    const mem = new Map<string, string>()
    const cache = new LocalBookingCache({
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
    })
    const s: BookingState = { estado: { x: 'Pagado' }, links: { x: 'https://a.io' }, t: 9 }
    cache.save(s)
    assert.deepEqual(cache.load(), s)
  })

  it('SyncedBookingStore guarda local de inmediato y remoto con retardo', async () => {
    const pushed: BookingState[] = []
    const remote = {
      push: (s: BookingState) => void pushed.push(s),
      connect: () => () => undefined,
    } as unknown as ClaudeDbSync
    const mem = new Map<string, string>()
    const cache = new LocalBookingCache({
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => void mem.set(k, v),
    })
    const store = new SyncedBookingStore(cache, remote, 5)
    store.save({ estado: { a: 'Reservado' }, links: {}, t: 1 })
    store.save({ estado: { a: 'Pagado' }, links: {}, t: 2 })
    assert.equal(cache.load().t, 2)
    assert.equal(pushed.length, 0)
    await new Promise((r) => setTimeout(r, 30))
    assert.deepEqual(
      pushed.map((p) => p.t),
      [2],
    ) // solo la última
  })

  it('ClaudeDbSync no hace nada fuera de un artefacto', () => {
    const stop = new ClaudeDbSync().connect(() => assert.fail('no debería llamar'))
    assert.doesNotThrow(stop)
  })
})
