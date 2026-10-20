import type { CSSProperties } from 'react'
import type { CityId } from '../domain/trip'

/**
 * Color de cada ciudad (variable CSS definida en styles/index.css, con versión clara y oscura).
 * Las excursiones heredan el color de la ciudad desde la que salen.
 */
export const CITY_COLOR: Readonly<Record<CityId, string>> = {
  madrid: 'var(--city-madrid)',
  toledo: 'var(--city-madrid)',
  segovia: 'var(--city-madrid)',
  vigo: 'var(--city-vigo)',
  santiago: 'var(--city-vigo)',
  porto: 'var(--city-porto)',
  guimaraes: 'var(--city-porto)',
  roma: 'var(--city-roma)',
  florencia: 'var(--city-florencia)',
  barcelona: 'var(--city-barcelona)',
  paris: 'var(--city-paris)',
  saopaulo: 'var(--city-saopaulo)',
}

export const HOME_COLOR = 'var(--city-home)'

export const colorOfCity = (id: CityId | null): string => (id ? CITY_COLOR[id] : HOME_COLOR)

/** Estilo con propiedades CSS personalizadas, tipado. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties
}
