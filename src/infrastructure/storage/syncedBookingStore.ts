import type { BookingStore } from '../../application/ports'
import type { BookingState } from '../../domain/booking'
import type { LocalBookingCache } from './localStorageStore'
import type { ClaudeDbSync } from './claudeDb'

/**
 * `BookingStore` real: local primero (instantáneo y sin conexión) y, si existe, copia remota.
 * Quien decide si la versión remota gana es la aplicación (`BookingService`), que luego la guarda.
 */
export class SyncedBookingStore implements BookingStore {
  private timer: ReturnType<typeof setTimeout> | undefined

  constructor(
    private readonly local: LocalBookingCache,
    private readonly remote: ClaudeDbSync | null,
    private readonly debounceMs: number = 400,
  ) {}

  load(): BookingState {
    return this.local.load()
  }

  save(state: BookingState): void {
    this.local.save(state)
    if (!this.remote) return
    clearTimeout(this.timer)
    this.timer = setTimeout(() => this.remote?.push(state), this.debounceMs)
  }

  subscribe(onRemoteChange: (state: BookingState) => void): () => void {
    if (!this.remote) return () => undefined
    return this.remote.connect((remote) => {
      if (remote) {
        onRemoteChange(remote)
      } else {
        // Base remota vacía: se siembra con lo local si hay algo.
        const mine = this.local.load()
        if (mine.t > 0) this.remote?.push(mine)
      }
    })
  }
}
