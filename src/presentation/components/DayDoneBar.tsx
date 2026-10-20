import { dayProgress, eventsOfDay } from '../../domain/agenda'
import type { Trip } from '../../domain/trip'
import { useAppStore } from '../AppContext'

/** Progreso de un día y botón para marcarlo o desmarcarlo completo. */
export function DayDoneBar({ trip, day, scope }: { trip: Trip; day: number; scope: string }) {
  const booking = useAppStore((s) => s.booking)
  const setDoneMany = useAppStore((s) => s.setDoneMany)
  const events = eventsOfDay(trip, day, booking)
  const { done, total } = dayProgress(trip, booking, day)
  if (total === 0) return null
  const all = done === total
  const keys = events.flatMap((e) => (e.key ? [e.key] : []))
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5" data-testid="day-done-bar">
      <span className={`font-mono text-[.75rem] ${all ? 'text-paid' : 'text-muted'}`}>
        Hecho: {done} de {total}
      </span>
      <button
        type="button"
        id={`day-all-${scope}-${day}`}
        className="cursor-pointer border-0 bg-transparent p-0 text-[.8rem] text-accent underline"
        onClick={() => setDoneMany(keys, !all)}
      >
        {all ? 'Desmarcar el día' : 'Marcar todo el día'}
      </button>
    </div>
  )
}
