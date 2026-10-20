import { createContext, useContext } from 'react'
import { useStore } from 'zustand'
import type { ExchangeRate } from '../domain/money'
import type { Trip } from '../domain/trip'
import type { AppState, AppStore } from './state/appStore'

export interface AppServices {
  readonly trip: Trip
  readonly store: AppStore
  readonly rate: ExchangeRate
}

export const AppContext = createContext<AppServices | null>(null)

export function useApp(): AppServices {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppContext.Provider>')
  return ctx
}

/** Lee una porción del store de Zustand. Usa selectores que devuelvan valores estables. */
export function useAppStore<T>(selector: (state: AppState) => T): T {
  return useStore(useApp().store, selector)
}
