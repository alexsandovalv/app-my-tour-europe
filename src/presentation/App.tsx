import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Composition } from '../composition'
import { progressOf } from '../domain/booking'
import { formatRate } from '../domain/money'
import type { CityId } from '../domain/trip'
import { AppContext, useApp, useBookingState } from './AppContext'
import { AgendaView } from './features/agenda/AgendaView'
import { CalendarView } from './features/calendar/CalendarView'
import { CityModal } from './features/city/CityModal'
import { LodgingView } from './features/lodging/LodgingView'
import { MadridView } from './features/madrid/MadridView'
import { MapView } from './features/map/MapView'
import { TicketsView } from './features/tickets/TicketsView'
import { TransportView } from './features/transport/TransportView'

const TABS = [
  { id: 'map', label: 'Mapa', view: MapView },
  { id: 'cal', label: 'Calendario', view: CalendarView },
  { id: 'age', label: 'Agenda', view: AgendaView },
  { id: 'mad', label: 'Madrid 21–26', view: MadridView },
  { id: 'hos', label: 'Dónde dormir', view: LodgingView },
  { id: 'tra', label: 'Trenes y vuelos', view: TransportView },
  { id: 'ent', label: 'Entradas', view: TicketsView },
] as const

type TabId = (typeof TABS)[number]['id']

function tabFromHash(): TabId {
  const hash = window.location.hash.replace('#', '')
  return TABS.find((t) => t.id === hash)?.id ?? 'map'
}

function Header({ tab, onTab }: { tab: TabId; onTab(id: TabId): void }) {
  const { trip } = useApp()
  const state = useBookingState()
  const keys = useMemo(
    () => [...trip.stays, ...trip.transfers, ...trip.tickets].map((x) => x.id),
    [trip],
  )
  const { done, total } = progressOf(state, keys)
  return (
    <header className="top">
      <div className="head-row">
        <div>
          <h1>{trip.title}</h1>
          <div className="sub">
            Madrid · Galicia · Porto · Roma · Florencia · Barcelona · París · Precios en US$
          </div>
        </div>
        <div className="prog" aria-live="polite">
          <div className="prog-top">
            <span>Reservas hechas</span>
            <span id="progTxt">
              {done} / {total}
            </span>
          </div>
          <div className="bar">
            <i id="progBar" style={{ width: `${total ? (100 * done) / total : 0}%` }} />
          </div>
        </div>
      </div>
      <nav className="tabs" role="tablist" aria-label="Secciones">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`tab-${t.id}`}
            aria-selected={t.id === tab}
            aria-controls={`p-${t.id}`}
            onClick={() => onTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </header>
  )
}

export function App({ composition }: { composition: Composition }) {
  const [tab, setTab] = useState<TabId>(tabFromHash)
  const [openCityId, setOpenCityId] = useState<CityId | null>(null)

  const selectTab = useCallback((id: TabId) => {
    setTab(id)
    try {
      history.replaceState(null, '', `#${id}`)
    } catch {
      /* historial no disponible (vista previa incrustada) */
    }
  }, [])

  useEffect(() => {
    const onHash = () => setTab(tabFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const services = useMemo(
    () => ({ ...composition, openCity: (id: CityId) => setOpenCityId(id) }),
    [composition],
  )
  const city = openCityId ? composition.trip.cities[openCityId] : null

  return (
    <AppContext.Provider value={services}>
      <div className="wrap">
        <Header tab={tab} onTab={selectTab} />
        {TABS.map(({ id, view: View }) => (
          <div key={id} hidden={id !== tab}>
            <View />
          </div>
        ))}
        {city && <CityModal city={city} onClose={() => setOpenCityId(null)} />}
        <p className="foot">
          Los enlaces abren búsquedas o webs oficiales; no reservan nada por sí solos. Verifica
          precio, horario y disponibilidad antes de pagar. Importes en dólares (US$) al cambio de
          referencia del BCE del 19 de octubre de 2026 ({formatRate(composition.rate)}). Tu estado
          de cada reserva se guarda en esta página.
        </p>
      </div>
    </AppContext.Provider>
  )
}
