import type { AgendaEvent, CountryCode, Trip } from './trip'

export interface DayCityLabel {
  readonly label: string
  readonly country: CountryCode
  readonly kind: 'stay' | 'travel' | 'excursion' | 'outside'
}

/**
 * Etiqueta de ciudad de un día de noviembre.
 * - Días del itinerario: la ciudad del plan ("Madrid", "Madrid → Vigo", "Santiago (excursión)").
 * - La víspera de la salida: el vuelo desde casa ("Lima → Madrid").
 * - El resto de noviembre: la ciudad de origen.
 */
export function cityLabelForDay(trip: Trip, day: number): DayCityLabel {
  const plan = trip.days.find((d) => d.day === day)
  if (plan) return { label: plan.cityLabel, country: plan.country, kind: plan.kind }
  const firstCity = trip.days[0]
  if (firstCity && day === trip.firstDay - 1) {
    return {
      label: `${trip.home.label} → ${firstCity.cityLabel}`,
      country: trip.home.country,
      kind: 'travel',
    }
  }
  return { label: trip.home.label, country: trip.home.country, kind: 'outside' }
}

/** Eventos del día en orden cronológico; los que no tienen hora van primero. */
export function eventsOfDay(trip: Trip, day: number): readonly AgendaEvent[] {
  return trip.agenda
    .filter((e) => e.day === day)
    .map((event, index) => ({ event, index }))
    .sort((a, b) => (a.event.time ?? '').localeCompare(b.event.time ?? '') || a.index - b.index)
    .map(({ event }) => event)
}

/** Noche que se duerme esa fecha, o `null` si no hay estancia registrada. */
export function sleepingAt(trip: Trip, day: number): string | null {
  const stay = trip.stays.find((s) => day >= s.checkIn && day < s.checkOut)
  return stay ? stay.name : null
}
