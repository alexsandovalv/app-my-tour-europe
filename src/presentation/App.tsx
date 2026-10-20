import { useEffect, useMemo, type ReactNode } from 'react'
import { progressOf } from '../domain/booking'
import { formatRate } from '../domain/money'
import { useApp, useAppStore } from './AppContext'
import { SortableTabs } from './components/SortableTabs'
import { ThemeControls } from './components/ThemeControls'
import { AgendaView } from './features/agenda/AgendaView'
import { BudgetView } from './features/budget/BudgetView'
import { CalendarView } from './features/calendar/CalendarView'
import { CityModal } from './features/city/CityModal'
import { LodgingView } from './features/lodging/LodgingView'
import { MadridView } from './features/madrid/MadridView'
import { MapView } from './features/map/MapView'
import { TicketsView } from './features/tickets/TicketsView'
import { TransportView } from './features/transport/TransportView'
import { useApplyTheme } from './hooks'
import { tabFromHash, type TabId } from './state/tabs'
import { ui } from './ui'

const TABS = [
  { id: 'map', label: 'Mapa', view: MapView },
  { id: 'cal', label: 'Calendario', view: CalendarView },
  { id: 'age', label: 'Agenda', view: AgendaView },
  { id: 'mad', label: 'Madrid 21–26', view: MadridView },
  { id: 'hos', label: 'Dónde dormir', view: LodgingView },
  { id: 'tra', label: 'Trenes y vuelos', view: TransportView },
  { id: 'ent', label: 'Entradas', view: TicketsView },
  { id: 'bud', label: 'Presupuesto', view: BudgetView },
] as const satisfies ReadonlyArray<{ id: TabId; label: string; view: () => ReactNode }>

function Header() {
  const { trip } = useApp()
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  const tabOrder = useAppStore((s) => s.tabOrder)
  const moveTab = useAppStore((s) => s.moveTab)
  const shiftTab = useAppStore((s) => s.shiftTab)
  const booking = useAppStore((s) => s.booking)
  const keys = useMemo(
    () => [...trip.stays, ...trip.transfers, ...trip.tickets].map((x) => x.id),
    [trip],
  )
  const { done, total } = progressOf(booking, keys)
  const ordered = useMemo(
    () =>
      tabOrder.flatMap((id) =>
        TABS.filter((t) => t.id === id).map(({ id, label }) => ({ id, label })),
      ),
    [tabOrder],
  )

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-[5] -mx-4 border-b border-line bg-bg px-4 pt-3">
      <div className="grid grid-cols-[1fr_auto] items-start gap-x-4 gap-y-3 sm:grid-cols-[1fr_14rem]">
        <div className="min-w-0 sm:row-span-2">
          <h1 className="text-[clamp(1.5rem,5.5vw,2.2rem)] leading-[1.05] font-extrabold tracking-tight">
            {trip.title}
          </h1>
          <div className="mt-1 text-[.85rem] text-muted">
            Madrid · Galicia · Porto · Roma · Florencia · Barcelona · París · Precios en US$
          </div>
        </div>
        <div className="justify-self-end">
          <ThemeControls />
        </div>
        <div className="col-span-2 sm:col-span-1 sm:self-end" aria-live="polite">
          <div className="flex justify-between font-mono text-xs text-muted">
            <span>Reservas hechas</span>
            <span id="progTxt">
              {done} / {total}
            </span>
          </div>
          <div className="mt-[5px] h-1.5 overflow-hidden rounded-[3px] bg-line">
            <i
              id="progBar"
              className="block h-full bg-accent transition-[width] duration-300"
              style={{ width: `${total ? (100 * done) / total : 0}%` }}
            />
          </div>
        </div>
      </div>
      <SortableTabs
        tabs={ordered}
        selected={tab}
        onSelect={setTab}
        onMove={moveTab}
        onShift={shiftTab}
      />
    </header>
  )
}

export function App() {
  const { trip, rate } = useApp()
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  const openCityId = useAppStore((s) => s.openCityId)
  const closeCity = useAppStore((s) => s.closeCity)
  useApplyTheme()

  // El hash de la URL sigue a la pestaña activa y viceversa.
  useEffect(() => {
    try {
      history.replaceState(null, '', `#${tab}`)
    } catch {
      /* historial no disponible (vista previa incrustada) */
    }
  }, [tab])
  useEffect(() => {
    const onHash = () => {
      const requested = tabFromHash(window.location.hash)
      if (requested) setTab(requested)
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [setTab])

  const city = openCityId ? trip.cities[openCityId] : null

  return (
    <div className="min-h-dvh bg-bg px-4 font-body text-[15px] leading-normal text-ink">
      <div className="mx-auto max-w-[860px] pt-5 pb-14">
        <Header />
        {TABS.map(({ id, view: View }) => (
          <div key={id} hidden={id !== tab}>
            <View />
          </div>
        ))}
        {city && <CityModal city={city} onClose={closeCity} />}
        <p className={`${ui.note} mt-7 max-w-[64ch] text-[.8rem]`}>
          Los enlaces abren búsquedas o webs oficiales; no reservan nada por sí solos. Verifica
          precio, horario y disponibilidad antes de pagar. Importes en dólares (US$) al cambio de
          referencia del BCE del 19 de octubre de 2026 ({formatRate(rate)}). Tu estado de cada
          reserva y tu tema se guardan en esta página.
        </p>
      </div>
    </div>
  )
}
