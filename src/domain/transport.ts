import type { BookingState } from './booking'
import type { Transfer, TransportMode } from './trip'

export const TRANSPORT_MODES: readonly TransportMode[] = ['air', 'train', 'bus']

export const MODE_LABEL: Readonly<Record<TransportMode, string>> = {
  air: 'Avión',
  train: 'Tren',
  bus: 'Bus',
}

export function isTransportMode(value: unknown): value is TransportMode {
  return (TRANSPORT_MODES as readonly unknown[]).includes(value)
}

/** Medio que el usuario registró para un tramo, o el previsto en el plan si no cambió nada. */
export function modeOf(state: BookingState, transfer: Transfer): TransportMode {
  return state.modes[transfer.id] ?? transfer.defaultMode
}
