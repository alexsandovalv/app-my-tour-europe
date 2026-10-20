import type { Trip } from '../../domain/trip'
import type { TripSource } from '../../application/ports'
import { AGENDA } from './agenda'
import { BERNABEU_PRICES, MADRID_BUDGET } from './budget'
import { CITIES } from './cities'
import { DAYS } from './days'
import { GUIDES } from './guides'
import { STAYS } from './stays'
import { TICKETS } from './tickets'
import { TRANSFERS } from './transfers'

/** Vuelos de la reserva compartida que condicionan los días 21 y 26. */
const SHARED_FLIGHTS: Trip['sharedFlights'] = [
  { code: 'PU302', route: 'Lima → Madrid', day: 21, time: '12:45', kind: 'arrival' },
  { code: 'PU301', route: 'Madrid → Lima', day: 26, time: '11:00', kind: 'departure' },
]

export const TRIP: Trip = {
  title: 'Ruta Europa, 3 al 27 de noviembre',
  home: { label: 'Lima' },
  firstDay: 3,
  lastDay: 27,
  cities: CITIES,
  days: DAYS,
  stays: STAYS,
  transfers: TRANSFERS,
  tickets: TICKETS,
  agenda: AGENDA,
  sharedFlights: SHARED_FLIGHTS,
  madridBudget: MADRID_BUDGET,
  bernabeuPrices: BERNABEU_PRICES,
  guides: GUIDES,
}

export const staticTripSource: TripSource = { load: () => TRIP }
