import { type PriceRange, sumRanges, scaleRange } from './money'
import type { BudgetLine, Stay, Transfer } from './trip'

export const nightsOf = (stay: Stay): number => stay.checkOut - stay.checkIn

export function stayTotal(stay: Stay): PriceRange {
  const nights = scaleRange(stay.nightly, nightsOf(stay))
  return stay.fees ? sumRanges([nights, stay.fees]) : nights
}

export interface LodgingSummary {
  readonly hostelNights: number
  readonly hostelTotal: PriceRange
  readonly apartment: Stay | undefined
}

export function summarizeLodging(stays: readonly Stay[]): LodgingSummary {
  const hostels = stays.filter((s) => s.kind === 'hostel')
  return {
    hostelNights: hostels.reduce((acc, s) => acc + nightsOf(s), 0),
    hostelTotal: sumRanges(hostels.map(stayTotal)),
    apartment: stays.find((s) => s.kind === 'apartment'),
  }
}

export interface TransportSummary {
  readonly legs: number
  readonly legsTotal: PriceRange
  readonly excursions: readonly Transfer[]
}

/** Separa los tramos entre ciudades de las excursiones de ida y vuelta. */
export function summarizeTransport(transfers: readonly Transfer[]): TransportSummary {
  const legs = transfers.filter((t) => !t.excursion)
  return {
    legs: legs.length,
    legsTotal: sumRanges(legs.map((t) => t.price)),
    excursions: transfers.filter((t) => t.excursion),
  }
}

export function budgetTotal(lines: readonly BudgetLine[]): PriceRange {
  return sumRanges(lines.map((l) => l.price))
}
