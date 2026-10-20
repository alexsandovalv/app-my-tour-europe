import { cycleStatus, decideSync, type BookingState, updateLink } from '../domain/booking'
import type { BookingStore } from './ports'

type Listener = () => void

/**
 * Casos de uso sobre las reservas: cambiar estado, pegar/quitar enlaces y sincronizar.
 * Expone `subscribe`/`getSnapshot` para que cualquier interfaz (React, otra) se enganche.
 */
export class BookingService {
  private state: BookingState
  private readonly listeners = new Set<Listener>()
  private readonly stopRemote: () => void

  constructor(
    private readonly store: BookingStore,
    private readonly clock: () => number = Date.now,
  ) {
    this.state = store.load()
    this.stopRemote = store.subscribe((remote) => this.onRemote(remote))
  }

  getSnapshot = (): BookingState => this.state

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  dispose(): void {
    this.stopRemote()
    this.listeners.clear()
  }

  cycleStatus(key: string): void {
    this.commit(cycleStatus(this.state, key, this.clock()))
  }

  /** Devuelve `false` si el enlace no es una URL http(s) válida. */
  setLink(key: string, raw: string): boolean {
    const result = updateLink(this.state, key, raw, this.clock())
    if (!result.ok) return false
    this.commit(result.state)
    return true
  }

  clearLink(key: string): void {
    this.setLink(key, '')
  }

  private commit(next: BookingState): void {
    this.state = next
    this.store.save(next)
    this.emit()
  }

  private onRemote(remote: BookingState): void {
    // Gana la versión más reciente.
    const decision = decideSync(this.state, remote)
    if (decision === 'adopt-remote') {
      this.state = remote
      this.store.save(remote)
      this.emit()
    } else if (decision === 'push-local') {
      this.store.save(this.state)
    }
  }

  private emit(): void {
    this.listeners.forEach((l) => l())
  }
}
