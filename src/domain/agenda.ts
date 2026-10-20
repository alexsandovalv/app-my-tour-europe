import { EMPTY_BOOKING_STATE, type BookingState } from './booking'
import { dayOfIso } from './expenses'
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

const slug = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)

/**
 * Clave estable de cada evento del plan, en el mismo orden que `trip.agenda`.
 * Un traslado usa el id del traslado, así que marcarlo en la agenda o en «Trenes y vuelos» es lo mismo.
 */
export function eventKeys(trip: Trip): readonly string[] {
  const seen = new Map<string, number>()
  return trip.agenda.map((e) => {
    const base = e.transferId ?? `ev:${e.day}:${slug(e.title)}`
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

export interface ConfirmedItem {
  readonly key: string
  readonly kind: 'stay' | 'transfer' | 'ticket'
  /** Día de noviembre según la fecha real que registró el usuario. */
  readonly day: number
  readonly title: string
}

/** Reservas con fecha real registrada, listas para mostrarse en su día. */
export function confirmedItems(trip: Trip, state: BookingState): readonly ConfirmedItem[] {
  const out: ConfirmedItem[] = []
  for (const stay of trip.stays) {
    const iso = state.dates[stay.id]
    if (iso)
      out.push({ key: stay.id, kind: 'stay', day: dayOfIso(iso), title: `Check-in: ${stay.name}` })
  }
  for (const transfer of trip.transfers) {
    const iso = state.dates[transfer.id]
    if (!iso) continue
    const title = `${MODE_LABEL[modeOf(state, transfer)]} a ${trip.cities[transfer.to].name}`
    out.push({ key: transfer.id, kind: 'transfer', day: dayOfIso(iso), title })
  }
  for (const ticket of trip.tickets) {
    const iso = state.dates[ticket.id]
    if (iso)
      out.push({
        key: ticket.id,
        kind: 'ticket',
        day: dayOfIso(iso),
        title: `Entrada: ${ticket.title}`,
      })
  }
  return out
}

const CONFIRMED_NOTE = 'Fecha confirmada en tu reserva'

/**
 * Eventos del día en orden cronológico; los que no tienen hora van primero.
 * Una reserva con fecha real se muestra en esa fecha: el traslado cambia de día y las entradas y los
 * check-in que no estaban en la agenda aparecen como eventos con reserva.
 */
export function eventsOfDay(
  trip: Trip,
  day: number,
  state: BookingState = EMPTY_BOOKING_STATE,
): readonly AgendaEvent[] {
  const confirmed = confirmedItems(trip, state)
  const moved = new Map(
    confirmed.filter((c) => c.kind === 'transfer').map((c) => [c.key, c.day] as const),
  )
  const keys = eventKeys(trip)
  const planned = trip.agenda
    .map((event, i) => {
      const realDay = event.transferId ? moved.get(event.transferId) : undefined
      const base = { ...describeEvent(trip, event, state), key: keys[i] }
      return realDay === undefined
        ? base
        : { ...base, day: realDay, note: `${CONFIRMED_NOTE}. ${base.note}`.trim() }
    })
    .filter((e) => e.day === day)

  const plannedTransfers = new Set(trip.agenda.flatMap((e) => (e.transferId ? [e.transferId] : [])))
  const extra: AgendaEvent[] = confirmed
    .filter((c) => c.day === day && (c.kind !== 'transfer' || !plannedTransfers.has(c.key)))
    .map((c) => ({
      key: c.key,
      day,
      title: c.title,
      note: CONFIRMED_NOTE,
      kind:
        c.kind === 'stay'
          ? ('info' as const)
          : c.kind === 'ticket'
            ? ('res' as const)
            : ('trip' as const),
    }))

  return [...planned, ...extra]
    .map((event, index) => ({ event, index }))
    .sort((a, b) => (a.event.time ?? '').localeCompare(b.event.time ?? '') || a.index - b.index)
    .map(({ event }) => event)
}

export interface Progress {
  readonly done: number
  readonly total: number
}

/** Actividades del día y cuántas están hechas. */
export function dayProgress(trip: Trip, state: BookingState, day: number): Progress {
  const events = eventsOfDay(trip, day, state)
  return {
    total: events.length,
    done: events.filter((e) => e.key !== undefined && state.done[e.key] === true).length,
  }
}

/** Todas las actividades de noviembre y cuántas están hechas. */
export function agendaProgress(trip: Trip, state: BookingState): Progress {
  let done = 0
  let total = 0
  for (let day = 1; day <= 30; day++) {
    const p = dayProgress(trip, state, day)
    done += p.done
    total += p.total
  }
  return { done, total }
}

/** Noche que se duerme esa fecha, o `null` si no hay estancia registrada. */
export function sleepingAt(trip: Trip, day: number): string | null {
  const stay = trip.stays.find((s) => day >= s.checkIn && day < s.checkOut)
  return stay ? stay.name : null
}
