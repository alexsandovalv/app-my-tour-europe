import { createContext, useContext, useSyncExternalStore } from 'react'
import type { BookingService } from '../application/bookingService'
import type { BookingState } from '../domain/booking'
import type { ExchangeRate } from '../domain/money'
import type { CityId, Trip } from '../domain/trip'

export interface AppServices {
  readonly trip: Trip
  readonly bookings: BookingService
  readonly rate: ExchangeRate
  openCity(id: CityId): void
}

export const AppContext = createContext<AppServices | null>(null)

export function useApp(): AppServices {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppContext.Provider>')
  return ctx
}

export function useBookingState(): BookingState {
  const { bookings } = useApp()
  return useSyncExternalStore(bookings.subscribe, bookings.getSnapshot)
}
