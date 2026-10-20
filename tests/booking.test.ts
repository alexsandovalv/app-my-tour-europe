import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideSync,
  EMPTY_BOOKING_STATE,
  isValidBookingUrl,
  nextStatus,
  progressOf,
  sanitizeBookingState,
  setTransportMode,
  type BookingState,
} from '../src/domain/booking'
import { ClaudeDbSync } from '../src/infrastructure/storage/claudeDb'
import {
  LocalBookingCache,
  type KeyValueStorage,
} from '../src/infrastructure/storage/localStorageStore'
import { LocalPreferencesStore } from '../src/infrastructure/storage/localPreferencesStore'
import { SyncedBookingStore } from '../src/infrastructure/storage/syncedBookingStore'

const memory = () => {
  const mem = new Map<string, string>()
  const storage: KeyValueStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
  }
  return storage
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

  it('sanea datos externos corruptos, incluido el medio de transporte', () => {
    const s = sanitizeBookingState({
      estado: { a: 'Pagado', b: 'xx' },
      links: { a: 'nope', b: 'https://x.io' },
      modes: { 't-1': 'air', 't-2': 'cohete' },
      t: 'z',
    })
    assert.deepEqual(s, {
      ...EMPTY_BOOKING_STATE,
      estado: { a: 'Pagado' },
      links: { b: 'https://x.io' },
      modes: { 't-1': 'air' },
      t: 0,
    })
    assert.deepEqual(sanitizeBookingState(null), EMPTY_BOOKING_STATE)
    // datos guardados antes de existir `modes` siguen siendo válidos
    assert.deepEqual(
      sanitizeBookingState({ ...EMPTY_BOOKING_STATE, estado: { a: 'Reservado' }, links: {}, t: 3 })
        .modes,
      {},
    )
  })

  it('registra el medio usado sin tocar lo demás', () => {
    const s = setTransportMode(EMPTY_BOOKING_STATE, 't-3', 'train', 9)
    assert.deepEqual(s.modes, { 't-3': 'train' })
    assert.equal(s.t, 9)
  })

  it('gana la versión más reciente', () => {
    const a: BookingState = { ...EMPTY_BOOKING_STATE, estado: {}, links: {}, modes: {}, t: 10 }
    assert.equal(decideSync(a, { ...a, t: 20 }), 'adopt-remote')
    assert.equal(decideSync(a, { ...a, t: 5 }), 'push-local')
    assert.equal(decideSync(a, { ...a }), 'none')
    assert.equal(decideSync(a, null), 'push-local')
    assert.equal(decideSync(EMPTY_BOOKING_STATE, null), 'none')
  })

  it('cuenta el progreso solo sobre las claves vigentes', () => {
    const s: BookingState = {
      ...EMPTY_BOOKING_STATE,
      estado: { a: 'Reservado', viejo: 'Pagado' },
      links: {},
      modes: {},
      t: 1,
    }
    assert.deepEqual(progressOf(s, ['a', 'b']), { done: 1, total: 2 })
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
    assert.equal(new LocalPreferencesStore(broken).load(), null)
    assert.doesNotThrow(() =>
      new LocalPreferencesStore(broken).save({ mode: 'dark', accent: 'azul' }),
    )
  })

  it('guarda y recupera reservas y tema', () => {
    const cache = new LocalBookingCache(memory())
    const s: BookingState = {
      ...EMPTY_BOOKING_STATE,
      estado: { x: 'Pagado' },
      links: { x: 'https://a.io' },
      modes: { 't-1': 'bus' },
      t: 9,
    }
    cache.save(s)
    assert.deepEqual(cache.load(), s)

    const prefs = new LocalPreferencesStore(memory())
    assert.equal(prefs.load(), null)
    prefs.save({ mode: 'dark', accent: 'violeta' })
    assert.deepEqual(prefs.load(), { mode: 'dark', accent: 'violeta' })
  })

  it('SyncedBookingStore guarda local de inmediato y remoto con retardo', async () => {
    const pushed: BookingState[] = []
    const remote = {
      push: (s: BookingState) => void pushed.push(s),
      connect: () => () => undefined,
    } as unknown as ClaudeDbSync
    const cache = new LocalBookingCache(memory())
    const store = new SyncedBookingStore(cache, remote, 5)
    store.save({ ...EMPTY_BOOKING_STATE, estado: { a: 'Reservado' }, links: {}, modes: {}, t: 1 })
    store.save({ ...EMPTY_BOOKING_STATE, estado: { a: 'Pagado' }, links: {}, modes: {}, t: 2 })
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
