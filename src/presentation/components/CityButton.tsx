import type { ReactNode } from 'react'
import type { CityId } from '../../domain/trip'
import { useApp } from '../AppContext'

export function CityButton({
  cityId,
  className = 'citybtn',
  children,
}: {
  cityId: CityId
  className?: string
  children: ReactNode
}) {
  const { openCity } = useApp()
  return (
    <button type="button" className={className} onClick={() => openCity(cityId)}>
      {children}
    </button>
  )
}
