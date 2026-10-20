import { EMPTY_BOOKING_STATE, type BookingState } from './booking'
import { MODE_LABEL, modeOf } from './transport'
import type { AgendaEvent, CityId, Trip } from './trip'

export interface DayCityLabel {
  readonly label: string
  /** Ciudad cuyo color identifica el día; `null` fuera del itinerario (en casa). */
  readonly cityId: CityId | null
  readonly kind: 'stay' | 'travel' | 'excursion' | 'outside'
}

/**
 * Etiqueta de ciudad de un día de noviembre.
 * - Días del itinerario: la ciudad del plan ("Madrid", "Madrid → Vigo", "Santiago").
 * - La víspera de la salida: el vuelo desde casa ("Lima → Madrid").
 * - El resto de noviembre: la ciudad de origen.
 */
export function cityLabelForDay(trip: Trip, day: number): DayCityLabel {
  const plan = trip.days.find((d) => d.day === day)
  if (plan) return { label: plan.cityLabel, cityId: plan.cityId, kind: plan.kind }
  const first = trip.days[0]
  if (first && day === trip.firstDay - 1) {
    return { label: `${trip.home.label} → ${first.cityLabel}`, cityId: null, kind: 'travel' }
  }
  return { label: trip.home.label, cityId: null, kind: 'outside' }
}

/** Un evento de traslado cambia de título según el medio que el usuario registró ("Tren a Vigo"). */
export function describeEvent(trip: Trip, event: AgendaEvent, state: BookingState): AgendaEvent {
  const transfer = event.transferId ? trip.transfers.find((t) => t.id === event.transferId) : null
  if (!transfer) return event
  const destination = trip.cities[transfer.to].name
  return { ...event, title: `${MODE_LABEL[modeOf(state, transfer)]} a ${destination}` }
}

/** Eventos del día en orden cronológico; los que no tienen hora van primero. */
export function eventsOfDay(
  trip: Trip,
  day: number,
  state: BookingState = EMPTY_BOOKING_STATE,
): readonly AgendaEvent[] {
  return trip.agenda
    .filter((e) => e.day === day)
    .map((event, index) => ({ event: describeEvent(trip, event, state), index }))
    .sort((a, b) => (a.event.time ?? '').localeCompare(b.event.time ?? '') || a.index - b.index)
    .map(({ event }) => event)
}

/** Noche que se duerme esa fecha, o `null` si no hay estancia registrada. */
export function sleepingAt(trip: Trip, day: number): string | null {
  const stay = trip.stays.find((s) => day >= s.checkIn && day < s.checkOut)
  return stay ? stay.name : null
}
