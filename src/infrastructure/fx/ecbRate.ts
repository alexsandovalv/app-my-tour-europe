import type { ExchangeRateProvider } from '../../application/ports'
import type { ExchangeRate } from '../../domain/money'

/**
 * Tipo de cambio de referencia del Banco Central Europeo del 19 de octubre de 2026.
 * Es fijo a propósito: el itinerario se planificó con esta cifra y así los precios no se
 * mueven cada día. Para actualizarlo basta cambiar este valor.
 */
export const ECB_RATE: ExchangeRate = {
  base: 'EUR',
  quote: 'USD',
  rate: 1.1225,
  asOf: '2026-10-19',
  source: 'Banco Central Europeo, tipo de referencia',
}

export const staticRateProvider: ExchangeRateProvider = { current: () => ECB_RATE }
