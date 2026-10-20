import type { ReactNode } from 'react'
import type { TransportMode } from '../../domain/trip'

function Svg({ children, className = 'size-4' }: { children: ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  )
}

export const SunIcon = () => (
  <Svg>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
)

export const MoonIcon = () => (
  <Svg>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
)

export const PaletteIcon = () => (
  <Svg>
    <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.8-.8 1.8-1.7 0-1.3-1.1-1.5-1.1-2.6 0-.9.7-1.7 1.7-1.7H17a4 4 0 0 0 4-4C21 6.6 17 3 12 3z" />
    <circle cx="7.5" cy="11" r="1" />
    <circle cx="10" cy="7" r="1" />
    <circle cx="15" cy="7" r="1" />
  </Svg>
)

const PlaneIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <path d="M10.2 13.8 3 11l1.6-1.6 8 .4L17 5a2 2 0 0 1 3 3l-4.8 4.4.4 8L14 22l-2.8-7.2z" />
  </Svg>
)

const TrainIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="5" y="3" width="14" height="14" rx="3" />
    <path d="M5 11h14M9 21l2-4M15 21l-2-4" />
    <circle cx="9" cy="14" r=".6" />
    <circle cx="15" cy="14" r=".6" />
  </Svg>
)

const BusIcon = ({ className }: { className?: string }) => (
  <Svg className={className}>
    <rect x="4" y="3" width="16" height="15" rx="3" />
    <path d="M4 11h16M7 21v-3M17 21v-3" />
    <circle cx="8" cy="14.5" r=".6" />
    <circle cx="16" cy="14.5" r=".6" />
  </Svg>
)

export function ModeIcon({ mode, className }: { mode: TransportMode; className?: string }) {
  if (mode === 'air') return <PlaneIcon className={className} />
  if (mode === 'train') return <TrainIcon className={className} />
  return <BusIcon className={className} />
}
