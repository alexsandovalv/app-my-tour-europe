import type { CSSProperties } from 'react'
import type { CountryCode } from '../domain/trip'

export const COUNTRY_COLOR: Readonly<Record<CountryCode, string>> = {
  es: 'var(--c-es)',
  pt: 'var(--c-pt)',
  it: 'var(--c-it)',
  fr: 'var(--c-fr)',
  br: 'var(--c-br)',
  pe: 'var(--c-pe)',
}

/** Estilo con propiedades CSS personalizadas, tipado. */
export function cssVars(vars: Record<`--${string}`, string | number>): CSSProperties {
  return vars as CSSProperties
}
