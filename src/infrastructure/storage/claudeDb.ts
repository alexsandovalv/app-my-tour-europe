import { sanitizeBookingState, type BookingState } from '../../domain/booking'

/** Contrato mínimo de la capacidad `db` de las páginas publicadas como artefacto. */
interface DbSnapshot {
  readonly exists: boolean
  data(): unknown
}
interface DbDocument {
  set(data: unknown): Promise<unknown>
  onSnapshot(next: (snap: DbSnapshot) => void, error?: (e: unknown) => void): () => void
}
interface DbHandle {
  doc(path: string): DbDocument
}
interface ClaudeRuntime {
  use(capability: 'db'): Promise<DbHandle | undefined>
}

declare global {
  interface Window {
    claude?: ClaudeRuntime
  }
}

const DOC_PATH = 'viaje/estado'

/**
 * Sincronización remota opcional. Solo existe cuando la app corre como artefacto de Claude;
 * en cualquier otro entorno `connect` no hace nada y la app queda solo con el almacenamiento local.
 */
export class ClaudeDbSync {
  private doc: DbDocument | null = null
  private writing = false
  private pending: BookingState | null = null

  /** Se conecta y empieza a escuchar; devuelve la función para dejar de escuchar. */
  connect(onRemote: (state: BookingState | null) => void): () => void {
    let stop: () => void = () => undefined
    let cancelled = false
    const runtime = typeof window !== 'undefined' ? window.claude : undefined
    if (!runtime?.use) return stop

    runtime
      .use('db')
      .then((db) => {
        if (!db || cancelled) return
        this.doc = db.doc(DOC_PATH)
        stop = this.doc.onSnapshot(
          (snap) => onRemote(snap.exists ? sanitizeBookingState(snap.data()) : null),
          () => undefined,
        )
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      stop()
    }
  }

  /** Escribe el último estado; si hay una escritura en curso, encadena solo la más reciente. */
  push(state: BookingState): void {
    if (!this.doc) return
    if (this.writing) {
      this.pending = state
      return
    }
    this.writing = true
    this.doc
      .set({ estado: state.estado, links: state.links, modes: state.modes, t: state.t })
      .catch(() => undefined)
      .then(() => {
        this.writing = false
        const next = this.pending
        this.pending = null
        if (next) this.push(next)
      })
  }
}
