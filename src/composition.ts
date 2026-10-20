/**
 * Raíz de composición: único lugar que conoce las implementaciones concretas.
 * El resto del código depende de los puertos de `application`.
 */
import { loadTrip } from './application/loadTrip'
import { staticTripSource } from './infrastructure/data/tripData'
import { staticRateProvider } from './infrastructure/fx/ecbRate'
import { ClaudeDbSync } from './infrastructure/storage/claudeDb'
import { LocalBookingCache, browserStorage } from './infrastructure/storage/localStorageStore'
import { LocalPreferencesStore } from './infrastructure/storage/localPreferencesStore'
import { SyncedBookingStore } from './infrastructure/storage/syncedBookingStore'
import { connectBookingSync, createAppStore } from './presentation/state/appStore'
import { tabFromHash } from './presentation/state/tabs'
import { systemPrefersDark } from './presentation/state/theme'

/** En pantallas estrechas la lista se lee mejor que la cuadrícula mensual. */
function isNarrowScreen(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(max-width: 639px)').matches)
}

export function createApp() {
  const trip = loadTrip(staticTripSource, staticRateProvider)
  const bookings = new SyncedBookingStore(
    new LocalBookingCache(browserStorage()),
    new ClaudeDbSync(),
  )
  const store = createAppStore({
    bookings,
    preferences: new LocalPreferencesStore(browserStorage()),
    firstDay: trip.firstDay,
    initialTab: tabFromHash(typeof window === 'undefined' ? '' : window.location.hash),
    initialAgendaView: isNarrowScreen() ? 'lista' : 'mes',
    systemPrefersDark,
  })
  connectBookingSync(store, bookings)
  return { trip, store, rate: staticRateProvider.current() }
}

export type Composition = ReturnType<typeof createApp>
