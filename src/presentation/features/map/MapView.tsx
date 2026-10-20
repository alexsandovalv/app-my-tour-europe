import { useMemo } from 'react'
import type { CityId, Trip } from '../../../domain/trip'
import { useApp } from '../../AppContext'
import { legPath, MAP_VIEWBOX, polygonPath, project } from './projection'
import { LAND_SHAPES } from './shapes'

type Anchor = 'start' | 'end'

/** Ubicación de la etiqueta de cada ciudad respecto de su punto (ajustes visuales del dibujo). */
const LABELS: Partial<Record<CityId, { anchor: Anchor; dx: number; dy: number }>> = {
  madrid: { anchor: 'start', dx: 14, dy: 6 },
  vigo: { anchor: 'end', dx: -14, dy: 6 },
  porto: { anchor: 'end', dx: -14, dy: 6 },
  roma: { anchor: 'end', dx: -14, dy: 6 },
  florencia: { anchor: 'end', dx: -14, dy: -2 },
  barcelona: { anchor: 'start', dx: 14, dy: 6 },
  paris: { anchor: 'start', dx: 14, dy: 6 },
}

/** Excursiones de un día que se dibujan como punto hueco. */
const EXCURSIONS: ReadonlyArray<{
  id: CityId
  label: string
  anchor: Anchor
  dx: number
  dy: number
}> = [
  { id: 'toledo', label: 'Toledo', anchor: 'start', dx: 10, dy: 18 },
  { id: 'santiago', label: 'Santiago', anchor: 'end', dx: -10, dy: -4 },
  { id: 'segovia', label: 'Segovia', anchor: 'end', dx: -10, dy: -4 },
]

/** Tramos entre ciudades: tren o bus en línea recta, vuelo en curva punteada. */
const LEGS: ReadonlyArray<{ from: CityId; to: CityId; air?: boolean; bow?: number }> = [
  { from: 'madrid', to: 'vigo' },
  { from: 'vigo', to: 'porto' },
  { from: 'porto', to: 'roma', air: true, bow: 0.16 },
  { from: 'roma', to: 'florencia' },
  { from: 'florencia', to: 'barcelona', air: true, bow: 0.2 },
  { from: 'barcelona', to: 'paris', air: true, bow: -0.2 },
  { from: 'paris', to: 'madrid', air: true, bow: 0.18 },
]

function stopDates(trip: Trip, cityId: CityId): string {
  return trip.stays
    .filter((s) => s.cityId === cityId)
    .map((s) => `${s.checkIn}–${s.checkOut}`)
    .join(' y ')
}

export function MapView() {
  const { trip, openCity } = useApp()

  const stops = useMemo(
    () =>
      (Object.keys(LABELS) as CityId[]).map((id) => ({
        city: trip.cities[id],
        dates: stopDates(trip, id),
        label: LABELS[id]!,
        at: project(trip.cities[id].coordinates.lon, trip.cities[id].coordinates.lat),
      })),
    [trip],
  )
  const at = (id: CityId) =>
    project(trip.cities[id].coordinates.lon, trip.cities[id].coordinates.lat)

  const activate = (id: CityId) => ({
    role: 'button' as const,
    tabIndex: 0,
    onClick: () => openCity(id),
    onKeyDown: (e: { key: string; preventDefault(): void }) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        openCity(id)
      }
    },
  })

  return (
    <section className="panel" id="p-map" role="tabpanel" aria-labelledby="tab-map">
      <p className="lead">
        Tu ruta: {stops.length} ciudades, con Madrid al inicio y al final. Pulsa un punto para ver
        los lugares que vas a visitar allí.
      </p>
      <div className="mapbox" tabIndex={0} aria-label="Mapa, desliza para ver completo">
        <svg
          id="mapSvg"
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          role="img"
          aria-label="Mapa esquemático del suroeste de Europa con las ciudades de la ruta"
        >
          <rect
            width={MAP_VIEWBOX.width}
            height={MAP_VIEWBOX.height}
            style={{ fill: 'var(--sea)' }}
          />
          {LAND_SHAPES.map((shape, i) => (
            <path key={i} className="land" d={polygonPath(shape)} />
          ))}
          {LEGS.map((leg) => (
            <path
              key={`${leg.from}-${leg.to}`}
              className={leg.air ? 'leg air' : 'leg'}
              d={legPath(at(leg.from), at(leg.to), Boolean(leg.air), leg.bow)}
            />
          ))}
          {EXCURSIONS.map(({ id, label, anchor, dx, dy }) => {
            const [x, y] = at(id)
            return (
              <g
                key={id}
                className="pin sat"
                aria-label={`Ver lugares de ${label}`}
                {...activate(id)}
              >
                <circle className="halo" cx={x} cy={y} r={13} />
                <circle className="dot" cx={x} cy={y} r={5} />
                <text x={x + dx} y={y + dy - (anchor === 'end' ? 0 : 12)} textAnchor={anchor}>
                  {label}
                </text>
              </g>
            )
          })}
          {stops.map(({ city, dates, label, at: [x, y] }) => (
            <g
              key={city.id}
              className="pin"
              aria-label={`Ver lugares de ${city.name}`}
              {...activate(city.id)}
            >
              <circle className="halo" cx={x} cy={y} r={17} />
              <circle className="dot" cx={x} cy={y} r={8} />
              <text x={x + label.dx} y={y + label.dy} textAnchor={label.anchor}>
                {city.name} <tspan className="d">{dates} nov</tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>
      <div className="legend">
        <span>
          <i className="ln" /> Tren o bus
        </span>
        <span>
          <i className="ln dash" /> Vuelo
        </span>
        <span>
          <i className="dt" /> Donde duermes
        </span>
        <span>
          <i className="dt hollow" /> Excursión de un día
        </span>
      </div>
      <p className="note">
        El mapa es un dibujo esquemático, no sirve para navegar. La escala en São Paulo queda fuera
        del recuadro.
      </p>
    </section>
  )
}
