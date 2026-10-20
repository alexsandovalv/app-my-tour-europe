import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { DEFAULT_THEME, isDark, sanitizeThemePrefs, toggledMode } from '../src/domain/preferences'

describe('preferencias de tema', () => {
  it('"sistema" sigue al sistema; claro y oscuro son fijos', () => {
    assert.equal(isDark('system', true), true)
    assert.equal(isDark('system', false), false)
    assert.equal(isDark('light', true), false)
    assert.equal(isDark('dark', false), true)
  })

  it('alternar pasa de lo visible a su opuesto', () => {
    assert.equal(toggledMode('light', false), 'dark')
    assert.equal(toggledMode('dark', false), 'light')
    assert.equal(toggledMode('system', true), 'light')
    assert.equal(toggledMode('system', false), 'dark')
  })

  it('sanea datos inválidos con los valores por defecto', () => {
    assert.deepEqual(sanitizeThemePrefs({ mode: 'neon', accent: 'rosa' }), DEFAULT_THEME)
    assert.deepEqual(sanitizeThemePrefs({ mode: 'dark', accent: 'azul' }), {
      mode: 'dark',
      accent: 'azul',
    })
    assert.deepEqual(sanitizeThemePrefs('x'), DEFAULT_THEME)
  })
})
