import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { TabOrderStore } from '../src/application/ports'
import {
  DEFAULT_TAB_ORDER,
  isDefaultTabOrder,
  moveTab,
  sanitizeTabOrder,
  shiftTab,
  type TabId,
} from '../src/domain/tabs'
import { EMPTY_BOOKING_STATE } from '../src/domain/booking'
import type { KeyValueStorage } from '../src/infrastructure/storage/localStorageStore'
import { LocalTabOrderStore } from '../src/infrastructure/storage/localTabOrderStore'
import { createAppStore } from '../src/presentation/state/appStore'
import { tabFromHash } from '../src/presentation/state/tabs'

const memory = () => {
  const mem = new Map<string, string>()
  const storage: KeyValueStorage = {
    getItem: (k) => mem.get(k) ?? null,
    setItem: (k, v) => void mem.set(k, v),
  }
  return storage
}

describe('orden de las pestañas (dominio)', () => {
  it('parte con las ocho pestañas en el orden original', () => {
    assert.deepEqual(DEFAULT_TAB_ORDER, ['map', 'cal', 'age', 'mad', 'hos', 'tra', 'ent', 'bud'])
    assert.equal(isDefaultTabOrder(DEFAULT_TAB_ORDER), true)
  })

  it('mueve una pestaña a una posición y conserva las demás en orden', () => {
    assert.deepEqual(moveTab(DEFAULT_TAB_ORDER, 'bud', 0).slice(0, 3), ['bud', 'map', 'cal'])
    assert.deepEqual(moveTab(DEFAULT_TAB_ORDER, 'map', 7).slice(-2), ['bud', 'map'])
    assert.deepEqual(moveTab(DEFAULT_TAB_ORDER, 'age', 5), [
      'map',
      'cal',
      'mad',
      'hos',
      'tra',
      'age',
      'ent',
      'bud',
    ])
    for (const t of [moveTab(DEFAULT_TAB_ORDER, 'age', 5), moveTab(DEFAULT_TAB_ORDER, 'bud', 0)]) {
      assert.deepEqual([...t].sort(), [...DEFAULT_TAB_ORDER].sort())
    }
  })

  it('ajusta posiciones fuera de rango y no cambia si ya está ahí', () => {
    assert.equal(moveTab(DEFAULT_TAB_ORDER, 'cal', 1), DEFAULT_TAB_ORDER)
    assert.equal(moveTab(DEFAULT_TAB_ORDER, 'map', -9), DEFAULT_TAB_ORDER)
    assert.equal(moveTab(DEFAULT_TAB_ORDER, 'zzz' as TabId, 3), DEFAULT_TAB_ORDER)
    assert.equal(moveTab(DEFAULT_TAB_ORDER, 'cal', 99).at(-1), 'cal')
  })

  it('desplaza con el teclado un lugar a cada lado y se detiene en los extremos', () => {
    assert.deepEqual(shiftTab(DEFAULT_TAB_ORDER, 'cal', -1).slice(0, 2), ['cal', 'map'])
    assert.deepEqual(shiftTab(DEFAULT_TAB_ORDER, 'cal', 1).slice(0, 3), ['map', 'age', 'cal'])
    assert.equal(shiftTab(DEFAULT_TAB_ORDER, 'map', -1), DEFAULT_TAB_ORDER)
    assert.equal(shiftTab(DEFAULT_TAB_ORDER, 'bud', 1), DEFAULT_TAB_ORDER)
  })

  it('sanea lo guardado: descarta ids raros y repetidos, y agrega los que faltan', () => {
    assert.deepEqual(sanitizeTabOrder(['bud', 'x', 'map', 'bud', 7, null]).slice(0, 2), [
      'bud',
      'map',
    ])
    assert.equal(sanitizeTabOrder(['bud', 'x', 'map', 'bud']).length, 8)
    assert.deepEqual(sanitizeTabOrder('basura'), DEFAULT_TAB_ORDER)
    assert.deepEqual(sanitizeTabOrder(null), DEFAULT_TAB_ORDER)
    assert.deepEqual(sanitizeTabOrder(['age']), [
      'age',
      'map',
      'cal',
      'mad',
      'hos',
      'tra',
      'ent',
      'bud',
    ])
  })

  it('el hash pide una pestaña solo si es válida', () => {
    assert.equal(tabFromHash('#age'), 'age')
    assert.equal(tabFromHash('#nada'), null)
    assert.equal(tabFromHash(''), null)
  })
})

describe('orden de las pestañas (almacenamiento y store)', () => {
  it('guarda y recupera el orden, y tolera datos corruptos o un almacenamiento roto', () => {
    const storage = memory()
    const store = new LocalTabOrderStore(storage)
    assert.equal(store.load(), null)
    store.save(['bud', 'map'])
    assert.deepEqual(store.load()?.slice(0, 2), ['bud', 'map'])
    storage.setItem('viaje-europa-pestanas-v1', '{no es json')
    assert.equal(new LocalTabOrderStore(storage).load(), null)
    const broken: KeyValueStorage = {
      getItem: () => {
        throw new Error('x')
      },
      setItem: () => {
        throw new Error('x')
      },
    }
    assert.equal(new LocalTabOrderStore(broken).load(), null)
    assert.doesNotThrow(() => new LocalTabOrderStore(broken).save(['map']))
  })

  const setup = (initial: readonly TabId[] | null, initialTab?: TabId) => {
    const saved: Array<readonly TabId[]> = []
    const tabOrderStore: TabOrderStore = { load: () => initial, save: (o) => void saved.push(o) }
    const store = createAppStore({
      bookings: {
        load: () => EMPTY_BOOKING_STATE,
        save: () => undefined,
        subscribe: () => () => undefined,
      },
      preferences: { load: () => null, save: () => undefined },
      tabOrderStore,
      firstDay: 3,
      ...(initialTab ? { initialTab } : {}),
    })
    return { store, saved }
  }

  it('abre en la primera pestaña del orden elegido, salvo que la URL pida otra', () => {
    assert.equal(setup(null).store.getState().tab, 'map')
    assert.equal(setup(sanitizeTabOrder(['bud', 'map'])).store.getState().tab, 'bud')
    assert.equal(setup(sanitizeTabOrder(['bud']), 'age').store.getState().tab, 'age')
  })

  it('mover, desplazar y restablecer cambian el orden y lo persisten solo cuando hay cambio', () => {
    const { store, saved } = setup(null)
    store.getState().moveTab('bud', 0)
    store.getState().shiftTab('bud', 1)
    assert.deepEqual(store.getState().tabOrder.slice(0, 2), ['map', 'bud'])
    store.getState().moveTab('map', 0) // ya está primero: no guarda
    store.getState().shiftTab('map', -1) // extremo: no guarda
    assert.equal(saved.length, 2)
    store.getState().resetTabOrder()
    assert.deepEqual(store.getState().tabOrder, DEFAULT_TAB_ORDER)
    store.getState().resetTabOrder() // ya es el original: no guarda
    assert.equal(saved.length, 3)
  })
})
