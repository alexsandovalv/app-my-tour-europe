/**
 * Raíz de composición: único lugar que conoce las implementaciones concretas.
 * El resto del código depende de los puertos de `application`.
 */
import { BookingService } from './application/bookingService'
import { loadTrip } from './application/loadTrip'
import { staticTripSource } from './infrastructure/data/tripData'
import { staticRateProvider } from './infrastructure/fx/ecbRate'
import { ClaudeDbSync } from './infrastructure/storage/claudeDb'
import { LocalBookingCache, browserStorage } from './infrastructure/storage/localStorageStore'
import { SyncedBookingStore } from './infrastructure/storage/syncedBookingStore'

export function createApp() {
  const trip = loadTrip(staticTripSource, staticRateProvider)
  const store = new SyncedBookingStore(new LocalBookingCache(browserStorage()), new ClaudeDbSync())
  const bookings = new BookingService(store)
  return { trip, bookings, rate: staticRateProvider.current() }
}

export type Composition = ReturnType<typeof createApp>
