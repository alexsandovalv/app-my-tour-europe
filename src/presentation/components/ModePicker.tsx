import { MODE_LABEL, modeOf, TRANSPORT_MODES } from '../../domain/transport'
import type { Transfer } from '../../domain/trip'
import { useAppStore } from '../AppContext'
import { ModeIcon } from './UiIcons'

/** Registra con qué medio se hizo (o se hará) un tramo: avión, tren o bus. Actualiza el mapa y la agenda. */
export function ModePicker({ transfer }: { transfer: Transfer }) {
  const mode = useAppStore((s) => modeOf(s.booking, transfer))
  const setMode = useAppStore((s) => s.setTransportMode)
  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="font-mono text-[.72rem] text-muted" id={`mode-label-${transfer.id}`}>
        Medio que usé
      </span>
      <div
        role="radiogroup"
        aria-labelledby={`mode-label-${transfer.id}`}
        className="inline-flex overflow-hidden rounded-lg border border-line"
      >
        {TRANSPORT_MODES.map((m) => (
          <button
            key={m}
            type="button"
            role="radio"
            id={`mode-${transfer.id}-${m}`}
            aria-checked={m === mode}
            className="inline-flex cursor-pointer items-center gap-1.5 border-0 bg-surface px-3 py-1.5 text-[.82rem] font-semibold text-muted aria-checked:bg-accent aria-checked:text-accent-ink"
            onClick={() => setMode(transfer.id, m)}
          >
            <ModeIcon mode={m} className="size-4" />
            {MODE_LABEL[m]}
          </button>
        ))}
      </div>
      {mode !== transfer.defaultMode && (
        <span className="text-[.78rem] text-muted">
          Plan original: {MODE_LABEL[transfer.defaultMode]}
        </span>
      )}
    </div>
  )
}
