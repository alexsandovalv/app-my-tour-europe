import type { ExchangeRate } from '../domain/money'
import type { BookingState } from '../domain/booking'
import type { Trip } from '../domain/trip'

/** Fuente de los datos del viaje. Los importes llegan en euros, como los publica cada proveedor. */
export interface TripSource {
  load(): Trip
}

/** Tipo de cambio de referencia a la fecha de la planificación. */
export interface ExchangeRateProvider {
  current(): ExchangeRate
}

/** Persistencia del estado de las reservas del usuario. */
export interface BookingStore {
  load(): BookingState
  save(state: BookingState): void
  /**
   * Avisa cuando otra sesión o dispositivo cambia el estado.
   * Devuelve la función para cancelar la suscripción.
   */
  subscribe(onRemoteChange: (state: BookingState) => void): () => void
}
