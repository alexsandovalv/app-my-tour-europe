import { confirmedItems, dayProgress } from '../../../domain/agenda'
import { weekdayLong, weekdayShort } from '../../../domain/calendar'
import { nightsOf } from '../../../domain/summary'
import type { DayPlan } from '../../../domain/trip'
import { CityButton } from '../../components/CityButton'
import { DayDoneBar } from '../../components/DayDoneBar'
import { useApp, useAppStore } from '../../AppContext'
import { CITY_COLOR, cssVars } from '../../theme'
import { ui } from '../../ui'

/** `scope` distingue los ids cuando la misma tarjeta aparece en el calendario y en Madrid. */
export function DayCard({ day, scope = 'cal' }: { day: DayPlan; scope?: string }) {
  const { trip } = useApp()
  const booking = useAppStore((s) => s.booking)
  const confirmed = confirmedItems(trip, booking).filter((c) => c.day === day.day)
  const progress = dayProgress(trip, booking, day.day)
  const complete = progress.total > 0 && progress.done === progress.total
  const tag = day.kind === 'travel' ? 'traslado' : day.kind === 'excursion' ? 'excursión' : null
  return (
    <li
      data-testid="day-card"
      data-complete={complete}
      className="grid grid-cols-[62px_minmax(0,1fr)] rounded-md border border-l-[5px] border-line border-l-[color:var(--cc)] bg-surface"
      style={cssVars({ '--cc': CITY_COLOR[day.cityId] })}
    >
      <div className="border-r border-dashed border-line py-2.5 text-center">
        <b className="block font-display text-[1.6rem] leading-none font-extrabold">{day.day}</b>
        <span className="font-mono text-[.68rem] tracking-wider text-muted uppercase">
          {weekdayShort(day.day)}
        </span>
      </div>
      <div className="min-w-0 px-3.5 py-2.5">
        <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1.5 font-semibold">
          <CityButton cityId={day.cityId}>{day.cityLabel}</CityButton>
          {complete && (
            <em
              data-testid="day-complete"
              className="rounded-[3px] bg-paid-bg px-1.5 py-0.5 font-mono text-[.65rem] tracking-wider text-paid not-italic uppercase"
            >
              ✓ Día hecho
            </em>
          )}
          {tag && (
            <em className="rounded-[3px] bg-soft px-1.5 py-0.5 font-mono text-[.65rem] tracking-wider text-accent not-italic uppercase">
              {tag}
            </em>
          )}
        </div>
        <p className="mt-[3px] mb-0">{day.plan}</p>
        <p className="mt-1.5 mb-0 text-[.85rem] text-muted">
          {day.reserve ? (
            <>
              <b className="font-semibold text-todo">Reservar: </b>
              {day.reserve}
            </>
          ) : (
            'Nada que reservar'
          )}
        </p>
        <div className="mt-1.5">
          <DayDoneBar trip={trip} day={day.day} scope={scope} />
        </div>
        {confirmed.length > 0 && (
          <p className="mt-1.5 mb-0 text-[.85rem]" data-testid="confirmed">
            <b className="font-semibold text-paid">Confirmado: </b>
            {confirmed.map((c) => c.title).join(' · ')}
          </p>
        )}
      </div>
    </li>
  )
}

export function CalendarView() {
  const { trip } = useApp()
  const openCity = useAppStore((s) => s.openCity)
  const first = trip.days[0]
  const last = trip.days[trip.days.length - 1]
  return (
    <section className={ui.panel} id="p-cal" role="tabpanel" aria-labelledby="tab-cal">
      <p className={ui.lead}>
        {trip.days.length} días, del {first && weekdayLong(first.day)} {first?.day} al{' '}
        {last && weekdayLong(last.day)} {last?.day}. La franja de color marca la ciudad y
        &quot;Reservar&quot; lo que debes asegurar antes de salir de Lima.
      </p>
      <div className="mt-0.5 flex gap-[3px]" aria-label="Noches por ciudad">
        {trip.stays.map((s) => {
          const nights = nightsOf(s)
          return (
            <button
              key={s.id}
              type="button"
              data-testid="route-item"
              title="Ver lugares"
              style={{ flex: `${nights} 1 0`, ...cssVars({ '--cc': CITY_COLOR[s.cityId] }) }}
              className="min-w-0 cursor-pointer border-0 border-t-[5px] border-t-[color:var(--cc)] bg-transparent px-0 pt-1.5 pb-0 text-left text-[.7rem] leading-tight text-ink max-[480px]:text-[.62rem]"
              onClick={() => openCity(s.cityId)}
            >
              <b className="block truncate font-semibold">{s.name.split(',')[0]}</b>
              <span className="font-mono text-[.65rem] text-muted">{nights}n</span>
            </button>
          )
        })}
      </div>
      <ol className={ui.list}>
        {trip.days.map((d) => (
          <DayCard key={d.day} day={d} />
        ))}
      </ol>
    </section>
  )
}
