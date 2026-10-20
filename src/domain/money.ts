/**
 * Dinero y conversión de moneda.
 *
 * Las tarifas se capturan en euros tal como las publican los proveedores (Renfe, Booking,
 * Real Madrid…) y se presentan siempre en dólares estadounidenses. La conversión es una
 * regla de dominio: pura, sin red y con redondeo al dólar entero.
 */
export type Currency = 'EUR' | 'USD'

export interface PriceRange {
  readonly low: number
  readonly high: number
  readonly currency: Currency
}

export interface ExchangeRate {
  readonly base: 'EUR'
  readonly quote: 'USD'
  /** Dólares por cada euro. */
  readonly rate: number
  /** Fecha de referencia (ISO). */
  readonly asOf: string
  readonly source: string
}

export const eur = (low: number, high: number = low): PriceRange => ({
  low,
  high,
  currency: 'EUR',
})

export function convertAmount(amountEur: number, fx: ExchangeRate): number {
  return Math.round(amountEur * fx.rate)
}

export function convertRange(range: PriceRange, fx: ExchangeRate): PriceRange {
  if (range.currency === 'USD') return range
  return {
    low: convertAmount(range.low, fx),
    high: convertAmount(range.high, fx),
    currency: 'USD',
  }
}

export function sumRanges(ranges: readonly PriceRange[]): PriceRange {
  const currency = ranges[0]?.currency ?? 'USD'
  if (ranges.some((r) => r.currency !== currency)) {
    throw new Error('No se pueden sumar rangos de monedas distintas')
  }
  return {
    low: ranges.reduce((acc, r) => acc + r.low, 0),
    high: ranges.reduce((acc, r) => acc + r.high, 0),
    currency,
  }
}

export function scaleRange(range: PriceRange, factor: number): PriceRange {
  return { ...range, low: range.low * factor, high: range.high * factor }
}

/** Importe tal como lo escribió el usuario, en la moneda en que lo pagó. */
export interface Money {
  readonly amount: number
  readonly currency: Currency
}

export const roundCents = (n: number): number => Math.round(n * 100) / 100

/** Valor en dólares de un importe propio; los euros se convierten con el cambio de referencia. */
export function usdOf(money: Money, fx: ExchangeRate): number {
  return roundCents(money.currency === 'USD' ? money.amount : money.amount * fx.rate)
}

export function isMoney(value: unknown): value is Money {
  if (typeof value !== 'object' || value === null) return false
  const m = value as Record<string, unknown>
  return (
    typeof m.amount === 'number' &&
    Number.isFinite(m.amount) &&
    m.amount > 0 &&
    m.amount <= MAX_AMOUNT &&
    (m.currency === 'USD' || m.currency === 'EUR')
  )
}

/** Tope razonable para un importe de viaje: evita valores absurdos por un error de tecleo. */
export const MAX_AMOUNT = 1_000_000

const SYMBOL: Record<Currency, string> = { EUR: '€', USD: 'US$' }

export function formatAmount(amount: number, currency: Currency = 'USD'): string {
  return `${SYMBOL[currency]}${amount.toLocaleString('en-US')}`
}

/** "US$1,234" para importes enteros y "US$12.50" cuando hay centavos. */
export function formatUsd(amount: number): string {
  const whole = Math.abs(amount - Math.round(amount)) < 0.005
  const text = whole
    ? Math.round(amount).toLocaleString('en-US')
    : amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return `${SYMBOL.USD}${text}`
}

export function formatRange(range: PriceRange): string {
  if (range.low === range.high) return formatAmount(range.low, range.currency)
  return `${formatAmount(range.low, range.currency)} a ${formatAmount(range.high, range.currency)}`
}

/** "1 € = US$1,1225" */
export function formatRate(fx: ExchangeRate): string {
  return `1 € = US$${String(fx.rate).replace('.', ',')}`
}

/** "€37", "€33,40" o "€ 1.200" dentro de un texto libre. */
const EUR_IN_TEXT = /€\s?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2})?|\d+(?:[.,]\d{1,2})?)/g

function parseEuropeanNumber(raw: string): number {
  // "1.200" -> miles; "33,40" -> decimal.
  if (/^\d{1,3}(\.\d{3})+(,\d{1,2})?$/.test(raw)) {
    return Number(raw.replace(/\./g, '').replace(',', '.'))
  }
  return Number(raw.replace(',', '.'))
}

/** Reemplaza cada importe en euros de un texto por su equivalente en dólares. */
export function convertEurosInText(text: string, fx: ExchangeRate): string {
  return text.replace(EUR_IN_TEXT, (_match, raw: string) =>
    formatAmount(convertAmount(parseEuropeanNumber(raw), fx), 'USD'),
  )
}
