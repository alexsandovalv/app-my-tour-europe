import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  convertAmount,
  convertEurosInText,
  convertRange,
  eur,
  formatRange,
  sumRanges,
} from '../src/domain/money'
import { ECB_RATE } from '../src/infrastructure/fx/ecbRate'

describe('dinero', () => {
  it('convierte con redondeo al dólar entero', () => {
    assert.equal(convertAmount(37, ECB_RATE), 42) // 41,53
    assert.equal(convertAmount(7, ECB_RATE), 8) // 7,86
  })

  it('convierte un rango y marca USD', () => {
    assert.deepEqual(convertRange(eur(45, 90), ECB_RATE), { low: 51, high: 101, currency: 'USD' })
  })

  it('no reconvierte un rango que ya está en dólares', () => {
    const usd = { low: 10, high: 20, currency: 'USD' as const }
    assert.equal(convertRange(usd, ECB_RATE), usd)
  })

  it('reemplaza importes dentro de textos, con coma decimal y miles', () => {
    assert.equal(
      convertEurosInText('de €45 a €90 por estancia', ECB_RATE),
      'de US$51 a US$101 por estancia',
    )
    assert.equal(
      convertEurosInText('cuesta €33,40 por persona', ECB_RATE),
      'cuesta US$37 por persona',
    )
    assert.equal(convertEurosInText('hoteles de €1.200', ECB_RATE), 'hoteles de US$1,347')
    assert.equal(convertEurosInText('sin importes', ECB_RATE), 'sin importes')
  })

  it('formatea rangos y suma sin mezclar monedas', () => {
    assert.equal(formatRange({ low: 51, high: 101, currency: 'USD' }), 'US$51 a US$101')
    assert.equal(formatRange({ low: 7, high: 7, currency: 'USD' }), 'US$7')
    assert.throws(() => sumRanges([eur(1), { low: 1, high: 1, currency: 'USD' }]))
  })
})
