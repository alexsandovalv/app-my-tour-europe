import { weekdayLong, weekdayShort } from '../../../domain/calendar'
import { nightsOf } from '../../../domain/summary'
import type { DayPlan } from '../../../domain/trip'
import { CityButton } from '../../components/CityButton'
import { useApp } from '../../AppContext'
import { COUNTRY_COLOR, cssVars } from '../../theme'

export function DayCard({ day }: { day: DayPlan }) {
  const tag = day.kind === 'travel' ? 'traslado' : day.kind === 'excursion' ? 'excursión' : null
  return (
    <li className="day" style={cssVars({ '--cc': COUNTRY_COLOR[day.country] })}>
      <div className="date">
        <b>{day.day}</b>
        <span>{weekdayShort(day.day)}</span>
      </div>
      <div className="dbody">
        <div className="dcity">
          <CityButton cityId={day.cityId}>{day.cityLabel}</CityButton>
          {tag && <em>{tag}</em>}
        </div>
        <p className="dplan">{day.plan}</p>
        <p className={day.reserve ? 'dres' : 'dres none'}>{day.reserve || 'Nada que reservar'}</p>
      </div>
    </li>
  )
}

export function CalendarView() {
  const { trip, openCity } = useApp()
  const first = trip.days[0]
  const last = trip.days[trip.days.length - 1]
  return (
    <section className="panel" id="p-cal" role="tabpanel" aria-labelledby="tab-cal">
      <p className="lead">
        {trip.days.length} días, del {first && weekdayLong(first.day)} {first?.day} al{' '}
        {last && weekdayLong(last.day)} {last?.day}. La franja de color marca el país y
        &quot;Reservar&quot; lo que debes asegurar antes de salir de Lima.
      </p>
      <div className="route" aria-label="Noches por ciudad">
        {trip.stays.map((s) => {
          const nights = nightsOf(s)
          return (
            <button
              key={s.id}
              type="button"
              style={cssVars({ '--n': nights, '--cc': COUNTRY_COLOR[s.country] })}
              title="Ver lugares"
              onClick={() => openCity(s.cityId)}
            >
              <b>{s.name.split(',')[0]}</b>
              <span>{nights}n</span>
            </button>
          )
        })}
      </div>
      <ol className="days">
        {trip.days.map((d) => (
          <DayCard key={d.day} day={d} />
        ))}
      </ol>
    </section>
  )
}
