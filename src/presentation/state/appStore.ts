import { createStore, type StoreApi } from 'zustand/vanilla'
import type { BookingStore, PreferencesStore } from '../../application/ports'
import {
  addExpense as addExpenseTo,
  cycleStatus,
  decideSync,
  removeExpense as removeExpenseFrom,
  setBudgetField,
  setDoneMany as setDoneManyIn,
  setPaid as setPaidIn,
  setRealDate as setRealDateIn,
  setTransportMode,
  updateExpense as updateExpenseIn,
  updateLink,
  type BookingState,
} from '../../domain/booking'
import type { BudgetSettings, Expense, ExpenseDraft } from '../../domain/expenses'
import type { Money } from '../../domain/money'
import {
  DEFAULT_THEME,
  toggledMode,
  type AccentId,
  type ThemeMode,
  type ThemePrefs,
} from '../../domain/preferences'
import type { CityId, TransportMode } from '../../domain/trip'
import type { TabId } from './tabs'

export type AgendaView = 'mes' | 'lista'

interface NavigationSlice {
  tab: TabId
  openCityId: CityId | null
  agendaView: AgendaView
  selectedDay: number
  setTab(tab: TabId): void
  openCity(id: CityId): void
  closeCity(): void
  setAgendaView(view: AgendaView): void
  selectDay(day: number): void
}

interface ThemeSlice {
  theme: ThemePrefs
  setThemeMode(mode: ThemeMode): void
  /** Alterna claro/oscuro según lo que se ve ahora. */
  toggleDark(): void
  setAccent(accent: AccentId): void
}

interface BookingsSlice {
  booking: BookingState
  cycleStatus(key: string): void
  /** `false` si el enlace no es una URL http(s) válida. */
  setLink(key: string, raw: string): boolean
  clearLink(key: string): void
  setTransportMode(transferId: string, mode: TransportMode): void
  /** Importe realmente pagado de una reserva (`null` lo borra). `false` si no es válido. */
  setPaid(key: string, money: Money | null): boolean
  /** Fecha real de una reserva (`null` la borra). `false` si no es de noviembre de 2026. */
  setRealDate(key: string, iso: string | null): boolean
  /** Devuelve el gasto creado o `null` si los datos no son válidos. */
  addExpense(draft: ExpenseDraft): Expense | null
  updateExpense(id: string, draft: ExpenseDraft): boolean
  removeExpense(id: string): void
  /** Marca o desmarca como hecha una actividad, reserva o punto de la lista. */
  setDone(key: string, value: boolean): void
  /** Marca o desmarca varias a la vez (p. ej. todas las actividades de un día). */
  setDoneMany(keys: readonly string[], value: boolean): void
  /** Presupuesto total o tope diario en US$ (`null` vuelve al sugerido). */
  setBudget(field: keyof BudgetSettings, value: number | null): boolean
  /** Llega una versión remota: gana la más reciente. */
  receiveRemote(remote: BookingState): void
}

export type AppState = NavigationSlice & ThemeSlice & BookingsSlice
export type AppStore = StoreApi<AppState>

export interface AppStoreDeps {
  bookings: BookingStore
  preferences: PreferencesStore
  initialTab?: TabId
  initialAgendaView?: AgendaView
  firstDay: number
  clock?: () => number
  systemPrefersDark?: () => boolean
}

/**
 * Estado de la interfaz con Zustand, en tres porciones (navegación, tema, reservas).
 * Las reglas viven en el dominio; la persistencia entra por los puertos de `application`.
 */
export function createAppStore(deps: AppStoreDeps): AppStore {
  const clock = deps.clock ?? Date.now
  const systemDark = deps.systemPrefersDark ?? (() => false)

  return createStore<AppState>()((set, get) => {
    const commitBooking = (next: BookingState) => {
      set({ booking: next })
      deps.bookings.save(next)
    }
    return {
      // — navegación
      tab: deps.initialTab ?? 'map',
      openCityId: null,
      agendaView: deps.initialAgendaView ?? 'mes',
      selectedDay: deps.firstDay,
      setTab: (tab) => set({ tab }),
      openCity: (id) => set({ openCityId: id }),
      closeCity: () => set({ openCityId: null }),
      setAgendaView: (agendaView) => set({ agendaView }),
      selectDay: (selectedDay) => set({ selectedDay }),

      // — tema
      theme: deps.preferences.load() ?? DEFAULT_THEME,
      setThemeMode: (mode) => {
        const theme = { ...get().theme, mode }
        set({ theme })
        deps.preferences.save(theme)
      },
      toggleDark: () => get().setThemeMode(toggledMode(get().theme.mode, systemDark())),
      setAccent: (accent) => {
        const theme = { ...get().theme, accent }
        set({ theme })
        deps.preferences.save(theme)
      },

      // — reservas
      booking: deps.bookings.load(),
      cycleStatus: (key) => commitBooking(cycleStatus(get().booking, key, clock())),
      setLink: (key, raw) => {
        const result = updateLink(get().booking, key, raw, clock())
        if (!result.ok) return false
        commitBooking(result.state)
        return true
      },
      clearLink: (key) => {
        get().setLink(key, '')
      },
      setTransportMode: (transferId, mode) =>
        commitBooking(setTransportMode(get().booking, transferId, mode, clock())),
      setPaid: (key, money) => {
        const next = setPaidIn(get().booking, key, money, clock())
        if (!next) return false
        commitBooking(next)
        return true
      },
      setRealDate: (key, iso) => {
        const next = setRealDateIn(get().booking, key, iso, clock())
        if (!next) return false
        commitBooking(next)
        return true
      },
      addExpense: (draft) => {
        const result = addExpenseTo(get().booking, draft, clock())
        if (!result) return null
        commitBooking(result.state)
        return result.expense
      },
      updateExpense: (id, draft) => {
        const next = updateExpenseIn(get().booking, id, draft, clock())
        if (!next) return false
        commitBooking(next)
        return true
      },
      setDone: (key, value) => commitBooking(setDoneManyIn(get().booking, [key], value, clock())),
      setDoneMany: (keys, value) =>
        commitBooking(setDoneManyIn(get().booking, keys, value, clock())),
      removeExpense: (id) => commitBooking(removeExpenseFrom(get().booking, id, clock())),
      setBudget: (field, value) => {
        const next = setBudgetField(get().booking, field, value, clock())
        if (!next) return false
        commitBooking(next)
        return true
      },
      receiveRemote: (remote) => {
        const decision = decideSync(get().booking, remote)
        if (decision === 'adopt-remote') commitBooking(remote)
        else if (decision === 'push-local') deps.bookings.save(get().booking)
      },
    }
  })
}

/** Conecta la sincronización remota al store; devuelve la función para desconectar. */
export function connectBookingSync(store: AppStore, bookings: BookingStore): () => void {
  return bookings.subscribe((remote) => store.getState().receiveRemote(remote))
}
