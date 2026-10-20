import { useState } from 'react'
import { cityLabelForDay, eventsOfDay, sleepingAt, type DayCityLabel } from '../../../domain/agenda'
import {
  dayLabel,
  novemberGrid,
  weekdayLong,
  WEEKDAY_HEADERS_MONDAY_FIRST,
} from '../../../domain/calendar'
import type { AgendaEvent, Trip } from '../../../domain/trip'
import { useApp } from '../../AppContext'
import { CityButton } from '../../components/CityButton'
import { COUNTRY_COLOR, cssVars } from '../../theme'

type View = 'mes' | 'lista'

function CityTag({ city }: { city: DayCityLabel }) {
  const cls = city.kind === 'outside' ? 'stay off' : city.kind === 'excursion' ? 'stay exc' : 'stay'
  return (
    <span
      className={cls}
      style={cssVars({ '--cc': COUNTRY_COLOR[city.country] })}
      title={city.label}
    >
      {city.kind === 'excursion' ? '↗ ' : ''}
      {city.label}
    </span>
  )
}

function EventItems({ events }: { events: readonly AgendaEvent[] }) {
  return (
    <ul className="evl">
      {events.map((e, i) => (
        <li key={i} className={`t-${e.kind}`}>
          <span className="tm">{e.time ?? ''}</span>
          <span className="tt">
            {e.title}
            <span className="nt">{e.note}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

function MonthGrid({
  trip,
  selected,
  onSelect,
}: {
  trip: Trip
  selected: number
  onSelect(d: number): void
}) {
  return (
    <div className="mgrid">
      {WEEKDAY_HEADERS_MONDAY_FIRST.map((w) => (
        <div key={w} className="wk">
          {w}
        </div>
      ))}
      {novemberGrid().map((day, i) => {
        const col7 = i % 7 === 6 ? ' c7' : ''
        if (day === null)
          return <div key={`b${i}`} className={`cell blank${col7}`} aria-hidden="true" />
        const city = cityLabelForDay(trip, day)
        const events = eventsOfDay(trip, day)
        const inTrip = city.kind !== 'outside'
        return (
          <button
            key={day}
            type="button"
            className={`cell${inTrip ? '' : ' out'}${col7}${day === selected ? ' on' : ''}`}
            data-day={day}
            aria-label={`${dayLabel(day)}, ${city.label}${events.length ? `, ${events.length} actividades` : ''}`}
            onClick={() => onSelect(day)}
          >
            <span className="n">{day === 1 ? '1 nov' : day}</span>
            <CityTag city={city} />
            {events.slice(0, 3).map((e, k) => (
              <span key={k} className={`ev t-${e.kind}`}>
                {e.time ? `${e.time} ` : ''}
                {e.title}
              </span>
            ))}
            {events.length > 3 && <span className="more">+{events.length - 3} más</span>}
            {events.length > 0 && (
              <span className="evd">
                {events.map((e, k) => (
                  <i key={k} className={`t-${e.kind}`} />
                ))}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function DayDetail({ trip, day }: { trip: Trip; day: number }) {
  const city = cityLabelForDay(trip, day)
  const events = eventsOfDay(trip, day)
  const plan = trip.days.find((d) => d.day === day)
  const sleeps = sleepingAt(trip, day)
  return (
    <div className="daydet" aria-live="polite">
      <h3>{dayLabel(day)}</h3>
      <CityTag city={city} />
      {sleeps && <div className="meta">Duermes en: {sleeps}</div>}
      {events.length ? (
        <EventItems events={events} />
      ) : (
        <p className="note">Sin actividades este día.</p>
      )}
      {plan?.reserve && <p className="dres">{plan.reserve}</p>}
      {plan && (
        <div className="links">
          <CityButton cityId={plan.cityId}>
            Ver lugares de {trip.cities[plan.cityId].name}
          </CityButton>
        </div>
      )}
    </div>
  )
}

function ListView({ trip }: { trip: Trip }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1).filter(
    (d) => eventsOfDay(trip, d).length > 0,
  )
  return (
    <div>
      {days.map((d) => (
        <div key={d} className="agd">
          <div className="dn">
            {d}
            <span>{weekdayLong(d).slice(0, 3)}</span>
          </div>
          <div>
            <CityTag city={cityLabelForDay(trip, d)} />
            <EventItems events={eventsOfDay(trip, d)} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AgendaView() {
  const { trip } = useApp()
  const [view, setView] = useState<View>(() =>
    typeof window !== 'undefined' && window.innerWidth < 640 ? 'lista' : 'mes',
  )
  const [selected, setSelected] = useState(trip.firstDay)

  return (
    <section className="panel" id="p-age" role="tabpanel" aria-labelledby="tab-age">
      <div className="agebar">
        <h2 className="mtitle">Noviembre 2026</h2>
        <div className="seg" role="group" aria-label="Vista de la agenda">
          <button
            type="button"
            id="vMes"
            aria-pressed={view === 'mes'}
            onClick={() => setView('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            id="vLista"
            aria-pressed={view === 'lista'}
            onClick={() => setView('lista')}
          >
            Lista
          </button>
        </div>
      </div>
      <div className="legend">
        <span>
          <i className="dt" /> Traslado
        </span>
        <span>
          <i className="dt" style={{ background: 'var(--muted)' }} /> Visita
        </span>
        <span>
          <i className="dt" style={{ background: 'var(--st-todo)' }} /> Con reserva
        </span>
        <span>
          <i className="dt" style={{ background: 'var(--st-paid)' }} /> Entrada gratuita
        </span>
        <span>
          <i className="dt" style={{ background: 'var(--st-res)' }} /> Aviso
        </span>
      </div>
      {view === 'mes' ? (
        <div id="ageMes" className="panel" style={{ paddingTop: 0 }}>
          <MonthGrid trip={trip} selected={selected} onSelect={setSelected} />
          <DayDetail trip={trip} day={selected} />
        </div>
      ) : (
        <div id="ageLista">
          <ListView trip={trip} />
        </div>
      )}
    </section>
  )
}
