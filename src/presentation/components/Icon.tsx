import type { PlaceIcon } from '../../domain/trip'
import { ICON_PATHS } from './iconPaths'

/** Icono de un lugar. Hereda fill/stroke del contenedor. */
export function Icon({ name }: { name: PlaceIcon }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
      className="h-auto w-full fill-none stroke-[inherit]"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  )
}
