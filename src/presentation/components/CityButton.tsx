import type { ReactNode } from 'react'
import type { CityId } from '../../domain/trip'
import { useAppStore } from '../AppContext'

/** Abre el carrusel de lugares de una ciudad. `plain` = estilo de enlace; si no, subrayado punteado. */
export function CityButton({
  cityId,
  plain = false,
  children,
}: {
  cityId: CityId
  plain?: boolean
  children: ReactNode
}) {
  const openCity = useAppStore((s) => s.openCity)
  return (
    <button
      type="button"
      className={
        plain
          ? 'cursor-pointer border-0 bg-transparent p-0 text-left text-sm font-medium text-accent underline underline-offset-4'
          : 'cursor-pointer border-0 bg-transparent p-0 text-left font-semibold text-ink underline decoration-dotted underline-offset-4'
      }
      onClick={() => openCity(cityId)}
    >
      {children}
    </button>
  )
}
