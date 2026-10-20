import {
  convertEurosInText,
  convertRange,
  type ExchangeRate,
  type PriceRange,
} from '../domain/money'
import type { Trip } from '../domain/trip'
import type { ExchangeRateProvider, TripSource } from './ports'

function isPriceRange(value: unknown): value is PriceRange {
  return (
    typeof value === 'object' &&
    value !== null &&
    'low' in value &&
    'high' in value &&
    'currency' in value
  )
}

function mapDeep(value: unknown, fx: ExchangeRate): unknown {
  if (typeof value === 'string') return convertEurosInText(value, fx)
  if (Array.isArray(value)) return value.map((v) => mapDeep(v, fx))
  if (isPriceRange(value)) return convertRange(value, fx)
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, mapDeep(v, fx)]))
  }
  return value
}

/** Presenta todo el viaje en dólares: rangos numéricos e importes escritos dentro de los textos. */
export function toUsd(trip: Trip, fx: ExchangeRate): Trip {
  return mapDeep(trip, fx) as Trip
}

/** Caso de uso: cargar el viaje ya convertido a dólares. */
export function loadTrip(source: TripSource, rates: ExchangeRateProvider): Trip {
  return toUsd(source.load(), rates.current())
}
