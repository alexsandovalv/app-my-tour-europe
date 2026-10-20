/** Calendario de noviembre de 2026. Todo en UTC para que no dependa de la zona horaria. */
const YEAR = 2026
const NOVEMBER = 10 // base 0

const WEEKDAYS_LONG = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const WEEKDAYS_SHORT = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
export const WEEKDAY_HEADERS_MONDAY_FIRST = [
  'lun',
  'mar',
  'mié',
  'jue',
  'vie',
  'sáb',
  'dom',
] as const

export const DAYS_IN_NOVEMBER = 30

function weekdayIndex(day: number): number {
  return new Date(Date.UTC(YEAR, NOVEMBER, day)).getUTCDay()
}

export function weekdayShort(day: number): string {
  return WEEKDAYS_SHORT[weekdayIndex(day)] ?? ''
}

export function weekdayLong(day: number): string {
  return WEEKDAYS_LONG[weekdayIndex(day)] ?? ''
}

/** "martes 3 de noviembre" */
export function dayLabel(day: number): string {
  return `${weekdayLong(day)} ${day} de noviembre`
}

/**
 * Cuadrícula de noviembre con la semana empezando en lunes.
 * Las celdas fuera de noviembre son `null`: la agenda no muestra días de octubre ni diciembre.
 */
export function novemberGrid(): ReadonlyArray<number | null> {
  const mondayFirst = (weekdayIndex(1) + 6) % 7
  const cells: Array<number | null> = Array.from({ length: mondayFirst }, () => null)
  for (let d = 1; d <= DAYS_IN_NOVEMBER; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}
