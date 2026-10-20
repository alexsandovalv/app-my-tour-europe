import { useEffect, useMemo, type ReactNode } from 'react'
import { progressOf } from '../domain/booking'
import { formatRate } from '../domain/money'
import { useApp, useAppStore } from './AppContext'
import { ThemeControls } from './components/ThemeControls'
import { AgendaView } from './features/agenda/AgendaView'
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
] as const satisfies ReadonlyArray<{ id: TabId; label: string; view: () => ReactNode }>

function Header() {
  const { trip } = useApp()
  const tab = useAppStore((s) => s.tab)
  const setTab = useAppStore((s) => s.setTab)
  const booking = useAppStore((s) => s.booking)
  const keys = useMemo(
    () => [...trip.stays, ...trip.transfers, ...trip.tickets].map((x) => x.id),
    [trip],
  )
  const { done, total } = progressOf(booking, keys)

  return (
    <header className="sticky top-[env(safe-area-inset-top,0px)] z-[5] -mx-4 border-b border-line bg-bg px-4 pt-3">
      <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
        <div>
          <h1 className="text-[clamp(1.5rem,5.5vw,2.2rem)] leading-[1.05] font-extrabold tracking-tight">
            {trip.title}
          </h1>
          <div className="mt-1 text-[.85rem] text-muted">
            Madrid · Galicia · Porto · Roma · Florencia · Barcelona · París · Precios en US$
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-[0_1_220px]" aria-live="polite">
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
          <ThemeControls />
        </div>
      </div>
      <nav
        className="scrollbar-none mt-2.5 flex gap-0.5 overflow-x-auto"
        role="tablist"
        aria-label="Secciones"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls={`p-${t.id}`}
            className="cursor-pointer border-0 border-b-[3px] border-transparent bg-transparent px-3 py-2.5 text-[.9rem] font-semibold whitespace-nowrap text-muted aria-selected:border-accent aria-selected:text-ink"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
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
    const onHash = () => setTab(tabFromHash(window.location.hash))
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [setTab])

  const city = openCityId ? trip.cities[openCityId] : null

  return (
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
        referencia del BCE del 19 de octubre de 2026 ({formatRate(rate)}). Tu estado de cada reserva
        y tu tema se guardan en esta página.
      </p>
    </div>
  )
}
