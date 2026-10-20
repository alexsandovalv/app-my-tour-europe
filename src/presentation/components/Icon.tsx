import type { PlaceIcon } from '../../domain/trip'
import { ICON_PATHS } from './iconPaths'

export function Icon({ name }: { name: PlaceIcon }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
