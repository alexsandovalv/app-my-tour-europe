import {
  agendaProgress,
  cityLabelForDay,
  dayProgress,
  eventsOfDay,
  sleepingAt,
  type DayCityLabel,
} from '../../../domain/agenda'
import {
  dayLabel,
  novemberGrid,
  weekdayLong,
  WEEKDAY_HEADERS_MONDAY_FIRST,
} from '../../../domain/calendar'
import { isDone, type BookingState } from '../../../domain/booking'
import type { AgendaEvent, AgendaEventKind, Trip } from '../../../domain/trip'
import { useApp, useAppStore } from '../../AppContext'
import { DoneBox } from '../../components/BookingControls'
import { DayDoneBar } from '../../components/DayDoneBar'
import { CityButton } from '../../components/CityButton'
import { colorOfCity, cssVars } from '../../theme'
import { ui } from '../../ui'

const CHIP: Record<AgendaEventKind, string> = {
  trip: 'bg-accent text-accent-ink',
  visit: 'bg-soft text-ink',
  res: 'bg-todo-bg text-todo',
  free: 'bg-paid-bg text-paid',
  info: 'bg-res-bg text-res',
}

const DOT: Record<AgendaEventKind, string> = {
  trip: 'bg-accent',
  visit: 'bg-muted',
  res: 'bg-todo',
  free: 'bg-paid',
  info: 'bg-res',
}

/** Etiqueta de ciudad del día, con el color de la ciudad. `compact` = versión pequeña para la cuadrícula. */
function CityTag({ city, compact = false }: { city: DayCityLabel; compact?: boolean }) {
  const base =
    'rounded-[3px] border-l-[3px] border-l-[color:var(--cc)] bg-[color-mix(in_srgb,var(--cc)_28%,var(--surface))] font-semibold'
  const size = compact
    ? 'overflow-hidden px-1 py-px text-[.62rem] text-ellipsis whitespace-nowrap max-sm:border-l-2 max-sm:pr-px max-sm:pl-0.5 max-sm:text-[.5rem] max-sm:leading-[1.15] max-sm:font-medium max-sm:tracking-tight max-sm:break-words max-sm:whitespace-normal'
    : 'inline-block self-start px-2 py-0.5 text-[.78rem]'
  const off = city.kind === 'outside' ? ' bg-transparent! font-medium! text-muted!' : ''
  return (
    <span
      data-testid="city-tag"
      className={`${base} ${size}${off}${city.kind === 'excursion' ? ' border-dashed' : ''}`}
      style={cssVars({ '--cc': colorOfCity(city.cityId) })}
      title={city.label}
    >
      {city.kind === 'excursion' ? '↗ ' : ''}
      {city.label}
    </span>
  )
}

function EventRow({ event: e }: { event: AgendaEvent }) {
  const done = useAppStore((s) => (e.key ? isDone(s.booking, e.key) : false))
  return (
    <li
      data-testid="event"
      data-done={done}
      className="grid grid-cols-[20px_52px_minmax(0,1fr)] items-baseline gap-2 max-sm:grid-cols-[20px_minmax(0,1fr)]"
    >
      <span className="self-start pt-0.5">
        {e.key && <DoneBox itemKey={e.key} label={`Hecho: ${e.title}`} />}
      </span>
      <span className="font-mono text-[.78rem] text-muted max-sm:hidden">{e.time ?? ''}</span>
      <span className={`font-semibold ${done ? 'text-muted line-through decoration-muted' : ''}`}>
        <i className={`mr-[7px] inline-block size-2 rounded-full align-baseline ${DOT[e.kind]}`} />
        {e.time && (
          <span className="mr-1.5 font-mono text-[.78rem] font-normal sm:hidden">{e.time}</span>
        )}
        {e.title}
        <span className="block text-[.85rem] font-normal text-muted no-underline">{e.note}</span>
      </span>
    </li>
  )
}

function EventItems({ events }: { events: readonly AgendaEvent[] }) {
  return (
    <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
      {events.map((e, i) => (
        <EventRow key={e.key ?? i} event={e} />
      ))}
    </ul>
  )
}

function MonthGrid({
  trip,
  booking,
  selected,
  onSelect,
}: {
  trip: Trip
  booking: BookingState
  selected: number
  onSelect(d: number): void
}) {
  return (
    <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-line bg-surface">
      {WEEKDAY_HEADERS_MONDAY_FIRST.map((w) => (
        <div
          key={w}
          className="border-b border-line px-2 py-1.5 text-right font-mono text-[.68rem] tracking-wider text-muted uppercase max-sm:px-0.5 max-sm:text-center"
        >
          {w}
        </div>
      ))}
      {novemberGrid().map((day, i) => {
        const cellBase =
          'min-h-[120px] min-w-0 border-0 border-r border-b border-line nth-[7n]:border-r-0 max-sm:min-h-[62px]'
        if (day === null) {
          return (
            <div
              key={`b${i}`}
              data-testid="blank-cell"
              className={`${cellBase} bg-bg`}
              aria-hidden="true"
            />
          )
        }
        const city = cityLabelForDay(trip, day)
        const events = eventsOfDay(trip, day, booking)
        const progress = dayProgress(trip, booking, day)
        const inTrip = city.kind !== 'outside'
        const on = day === selected
        return (
          <button
            key={day}
            type="button"
            data-day={day}
            aria-label={`${dayLabel(day)}, ${city.label}${events.length ? `, ${events.length} actividades` : ''}`}
            aria-current={on ? 'date' : undefined}
            onClick={() => onSelect(day)}
            className={`${cellBase} flex cursor-pointer flex-col gap-[3px] p-1 text-left max-sm:px-0.5 max-sm:py-[3px] ${inTrip ? 'bg-surface text-ink' : 'bg-bg text-muted'} ${on ? 'shadow-[inset_0_0_0_2px_var(--accent)]' : ''}`}
          >
            <span className="flex items-center justify-between gap-1">
              {progress.total > 0 && progress.done === progress.total ? (
                <span
                  data-testid="day-complete"
                  className="rounded-full bg-paid-bg px-1.5 text-[.65rem] font-semibold text-paid"
                  title="Todo hecho"
                >
                  ✓
                </span>
              ) : (
                <span />
              )}
              <span className="font-display text-[.95rem] font-semibold">
                {day === 1 ? '1 nov' : day}
              </span>
            </span>
            <CityTag city={city} compact />
            {events.slice(0, 3).map((e, k) => {
              const done = e.key ? isDone(booking, e.key) : false
              return (
                <span
                  key={k}
                  data-done={done}
                  className={`overflow-hidden rounded-[3px] px-1 py-px text-[.68rem] leading-[1.3] text-ellipsis whitespace-nowrap max-sm:hidden ${CHIP[e.kind]}${done ? ' line-through opacity-55' : ''}`}
                >
                  {done ? '✓ ' : ''}
                  {e.time ? `${e.time} ` : ''}
                  {e.title}
                </span>
              )
            })}
            {events.length > 3 && (
              <span className="text-[.62rem] text-muted max-sm:hidden">
                +{events.length - 3} más
              </span>
            )}
            {events.length > 0 && (
              <span className="hidden flex-wrap gap-[3px] max-sm:flex">
                {events.map((e, k) => (
                  <i
                    key={k}
                    className={`size-1.5 rounded-full ${DOT[e.kind]}${e.key && isDone(booking, e.key) ? ' opacity-30' : ''}`}
                  />
                ))}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function DayDetail({ trip, booking, day }: { trip: Trip; booking: BookingState; day: number }) {
  const city = cityLabelForDay(trip, day)
  const events = eventsOfDay(trip, day, booking)
  const plan = trip.days.find((d) => d.day === day)
  const sleeps = sleepingAt(trip, day)
  return (
    <div
      className={`${ui.card} flex flex-col gap-1.5 px-4 py-3.5`}
      aria-live="polite"
      data-testid="day-detail"
    >
      <h3 className="text-[1.2rem] font-extrabold first-letter:uppercase">{dayLabel(day)}</h3>
      <CityTag city={city} />
      {sleeps && <div className={ui.meta}>Duermes en: {sleeps}</div>}
      {events.length ? (
        <>
          <DayDoneBar trip={trip} day={day} scope="age" />
          <EventItems events={events} />
        </>
      ) : (
        <p className={ui.note}>Sin actividades este día.</p>
      )}
      {plan?.reserve && (
        <p className="mt-1.5 mb-0 text-[.85rem] text-muted">
          <b className="font-semibold text-todo">Reservar: </b>
          {plan.reserve}
        </p>
      )}
      {plan && (
        <div className={ui.links}>
          <CityButton cityId={plan.cityId} plain>
            Ver lugares de {trip.cities[plan.cityId].name}
          </CityButton>
        </div>
      )}
    </div>
  )
}

function ListView({ trip, booking }: { trip: Trip; booking: BookingState }) {
  const days = Array.from({ length: 30 }, (_, i) => i + 1).filter(
    (d) => eventsOfDay(trip, d, booking).length > 0,
  )
  return (
    <div id="ageLista">
      {days.map((d) => (
        <div
          key={d}
          data-testid="list-day"
          className="grid grid-cols-[64px_minmax(0,1fr)] gap-3 border-b border-line py-3"
        >
          <div className="text-center font-display text-2xl leading-none font-extrabold">
            {d}
            <span className="mt-[3px] block font-mono text-[.68rem] font-medium tracking-wider text-muted uppercase">
              {weekdayLong(d).slice(0, 3)}
            </span>
          </div>
          <div className="flex flex-col gap-1.5">
            <CityTag city={cityLabelForDay(trip, d)} />
            <EventItems events={eventsOfDay(trip, d, booking)} />
          </div>
        </div>
      ))}
    </div>
  )
}

export function AgendaView() {
  const { trip } = useApp()
  const booking = useAppStore((s) => s.booking)
  const view = useAppStore((s) => s.agendaView)
  const setView = useAppStore((s) => s.setAgendaView)
  const selected = useAppStore((s) => s.selectedDay)
  const selectDay = useAppStore((s) => s.selectDay)
  const progress = agendaProgress(trip, booking)

  return (
    <section className={ui.panel} id="p-age" role="tabpanel" aria-labelledby="tab-age">
      <div className="flex flex-wrap items-center justify-between gap-x-[18px] gap-y-2.5">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Noviembre 2026</h2>
          <p className={ui.meta} id="ageProgress">
            Hecho: {progress.done} de {progress.total} actividades
          </p>
        </div>
        <div className={ui.seg} role="group" aria-label="Vista de la agenda">
          <button
            type="button"
            id="vMes"
            className={ui.segBtn}
            aria-pressed={view === 'mes'}
            onClick={() => setView('mes')}
          >
            Mes
          </button>
          <button
            type="button"
            id="vLista"
            className={ui.segBtn}
            aria-pressed={view === 'lista'}
            onClick={() => setView('lista')}
          >
            Lista
          </button>
        </div>
      </div>
      <div className={ui.legend}>
        <span>
          <i className={`${ui.dot} bg-accent`} /> Traslado
        </span>
        <span>
          <i className={`${ui.dot} bg-muted`} /> Visita
        </span>
        <span>
          <i className={`${ui.dot} bg-todo`} /> Con reserva
        </span>
        <span>
          <i className={`${ui.dot} bg-paid`} /> Entrada gratuita
        </span>
        <span>
          <i className={`${ui.dot} bg-res`} /> Aviso
        </span>
      </div>
      {view === 'mes' ? (
        <div id="ageMes" className="flex flex-col gap-4">
          <MonthGrid trip={trip} booking={booking} selected={selected} onSelect={selectDay} />
          <DayDetail trip={trip} booking={booking} day={selected} />
        </div>
      ) : (
        <ListView trip={trip} booking={booking} />
      )}
    </section>
  )
}
