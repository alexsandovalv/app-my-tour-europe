import { useMemo } from 'react'
import { MODE_LABEL, modeOf } from '../../../domain/transport'
import type { CityId, Transfer, Trip, TransportMode } from '../../../domain/trip'
import { useApp, useAppStore } from '../../AppContext'
import { ModeIcon } from '../../components/UiIcons'
import { CITY_COLOR, cssVars } from '../../theme'
import { ui } from '../../ui'
import { legGeometry, MAP_VIEWBOX, polygonPath, project } from './projection'
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

/** Curvatura de los vuelos (para que no se tapen entre sí). */
const AIR_BOW: Partial<Record<string, number>> = {
  't-4': 0.16,
  't-6': 0.2,
  't-7': -0.2,
  't-8': 0.18,
}

/** Desde esta distancia (en px del dibujo) un tramo por tierra también se dibuja curvo. */
const LONG_LEG_PX = 220

const DASH: Record<TransportMode, string | undefined> = {
  air: '3 8',
  train: undefined,
  bus: '11 6',
}

interface Leg {
  readonly n: number
  readonly transfer: Transfer
  readonly mode: TransportMode
  readonly color: string
}

function stopDates(trip: Trip, cityId: CityId): string {
  return trip.stays
    .filter((s) => s.cityId === cityId)
    .map((s) => `${s.checkIn}–${s.checkOut}`)
    .join(' y ')
}

const activate = (open: () => void) => ({
  role: 'button' as const,
  tabIndex: 0,
  onClick: open,
  onKeyDown: (e: { key: string; preventDefault(): void }) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      open()
    }
  },
})

export function MapView() {
  const { trip } = useApp()
  const booking = useAppStore((s) => s.booking)
  const openCity = useAppStore((s) => s.openCity)
  const setTab = useAppStore((s) => s.setTab)

  const at = (id: CityId) =>
    project(trip.cities[id].coordinates.lon, trip.cities[id].coordinates.lat)

  /** Tramos entre ciudades, numerados en orden; la flecha toma el color de la ciudad de llegada. */
  const legs: readonly Leg[] = useMemo(
    () =>
      trip.transfers
        .filter((t) => !t.excursion)
        .map((transfer, i) => ({
          n: i + 1,
          transfer,
          mode: modeOf(booking, transfer),
          color: CITY_COLOR[transfer.to],
        })),
    [trip, booking],
  )

  const stops = (Object.keys(LABELS) as CityId[]).map((id) => ({
    city: trip.cities[id],
    dates: stopDates(trip, id),
    label: LABELS[id]!,
    at: at(id),
  }))

  return (
    <section className={ui.panel} id="p-map" role="tabpanel" aria-labelledby="tab-map">
      <p className={ui.lead}>
        Tu ruta: {stops.length} ciudades, con Madrid al inicio y al final. Cada flecha lleva el
        color de la ciudad a la que llegas y su número de tramo. Pulsa un punto para ver los lugares
        que vas a visitar.
      </p>
      <div
        className="overflow-x-auto rounded-lg border border-line bg-sea"
        tabIndex={0}
        aria-label="Mapa, desliza para ver completo"
      >
        <svg
          id="mapSvg"
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          role="img"
          aria-label="Mapa esquemático del suroeste de Europa con las ciudades de la ruta y los tramos numerados"
          className="block h-auto w-full min-w-[760px]"
        >
          <rect width={MAP_VIEWBOX.width} height={MAP_VIEWBOX.height} className="fill-sea" />
          {LAND_SHAPES.map((shape, i) => (
            <path
              key={i}
              d={polygonPath(shape)}
              className="fill-land stroke-landline stroke-[1.2] [stroke-linejoin:round]"
            />
          ))}

          {legs.map(({ n, transfer, mode, color }) => {
            const [from, to] = [at(transfer.from), at(transfer.to)]
            // Los tramos largos se arquean siempre: en recta pasarían por encima de otras ciudades.
            const curved =
              mode === 'air' || Math.hypot(to[0] - from[0], to[1] - from[1]) > LONG_LEG_PX
            const geo = legGeometry(from, to, curved, AIR_BOW[transfer.id])
            const arrow = geo.at(Math.min(0.85, Math.max(0.45, 1 - 28 / geo.length)))
            const [bx, by] = geo.beside(0.5, 15)
            return (
              <g
                key={transfer.id}
                data-testid="leg"
                data-leg={n}
                data-mode={mode}
                style={cssVars({ '--c': color })}
              >
                <title>{`${n}. ${trip.cities[transfer.from].name} → ${trip.cities[transfer.to].name} (${MODE_LABEL[mode]})`}</title>
                <path
                  d={geo.d}
                  fill="none"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeDasharray={DASH[mode]}
                  className="stroke-(--c)"
                />
                <polygon
                  points="-8,-7 9,0 -8,7"
                  transform={`translate(${arrow.x.toFixed(1)} ${arrow.y.toFixed(1)}) rotate(${arrow.angle.toFixed(1)})`}
                  className="fill-(--c) stroke-surface stroke-[1.5] [stroke-linejoin:round]"
                />
                <circle cx={bx} cy={by} r={10} className="fill-(--c) stroke-surface stroke-2" />
                <text
                  x={bx}
                  y={by}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="fill-bg font-body text-[13px] font-bold"
                >
                  {n}
                </text>
              </g>
            )
          })}

          {EXCURSIONS.map(({ id, label, anchor, dx, dy }) => {
            const [x, y] = at(id)
            return (
              <g
                key={id}
                aria-label={`Ver lugares de ${label}`}
                className="group cursor-pointer outline-none"
                style={cssVars({ '--c': CITY_COLOR[id] })}
                {...activate(() => openCity(id))}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={13}
                  className="fill-(--c) opacity-20 group-hover:opacity-45 group-focus-visible:stroke-ink group-focus-visible:stroke-2"
                />
                <circle cx={x} cy={y} r={5} className="fill-land stroke-(--c) stroke-[2.5]" />
                <text
                  x={x + dx}
                  y={y + dy - (anchor === 'end' ? 0 : 12)}
                  textAnchor={anchor}
                  className="fill-ink stroke-land font-body text-base font-medium [paint-order:stroke] stroke-[5px] [stroke-linejoin:round]"
                >
                  {label}
                </text>
              </g>
            )
          })}

          {stops.map(({ city, dates, label, at: [x, y] }) => (
            <g
              key={city.id}
              aria-label={`Ver lugares de ${city.name}`}
              className="group cursor-pointer outline-none"
              style={cssVars({ '--c': CITY_COLOR[city.id] })}
              {...activate(() => openCity(city.id))}
            >
              <circle
                cx={x}
                cy={y}
                r={17}
                className="fill-(--c) opacity-20 group-hover:opacity-45 group-focus-visible:stroke-ink group-focus-visible:stroke-2"
              />
              <circle cx={x} cy={y} r={8} className="fill-(--c) stroke-surface stroke-[3]" />
              <text
                x={x + label.dx}
                y={y + label.dy}
                textAnchor={label.anchor}
                className="fill-ink stroke-land font-body text-[21px] font-semibold [paint-order:stroke] stroke-[5px] [stroke-linejoin:round]"
              >
                {city.name}{' '}
                <tspan className="fill-muted font-mono text-sm font-medium">{dates} nov</tspan>
              </text>
            </g>
          ))}
        </svg>
      </div>

      <ol
        className="m-0 grid list-none grid-cols-2 gap-x-6 gap-y-2 p-0 max-sm:grid-cols-1"
        aria-label="Tramos de la ruta"
      >
        {legs.map(({ n, transfer, mode, color }) => (
          <li
            key={transfer.id}
            className="flex items-center gap-2.5 text-[.9rem]"
            style={cssVars({ '--c': color })}
          >
            <span className="inline-flex size-6 flex-none items-center justify-center rounded-full bg-(--c) text-xs font-bold text-bg">
              {n}
            </span>
            <span className="font-semibold">
              {trip.cities[transfer.from].name} → {trip.cities[transfer.to].name}
            </span>
            <span className="ml-auto inline-flex items-center gap-1 text-muted">
              <ModeIcon mode={mode} className="size-4" />
              {MODE_LABEL[mode]}
            </span>
          </li>
        ))}
      </ol>

      <div className={ui.legend}>
        <span>
          <i className="inline-block w-[26px] border-t-[3px] border-muted" /> Tren
        </span>
        <span>
          <i className="inline-block w-[26px] border-t-[3px] border-dashed border-muted" /> Bus
        </span>
        <span>
          <i className="inline-block w-[26px] border-t-[3px] border-dotted border-muted" /> Avión
        </span>
        <span>
          <i className={`${ui.dot} bg-muted`} /> Donde duermes
        </span>
        <span>
          <i className={`${ui.dot} border-2 border-muted bg-land`} /> Excursión de un día
        </span>
      </div>
      <p className={`${ui.note} m-0`}>
        ¿Viajaste en otro medio? Cámbialo en{' '}
        <button
          type="button"
          className="cursor-pointer border-0 bg-transparent p-0 font-medium text-accent underline underline-offset-[3px]"
          onClick={() => setTab('tra')}
        >
          Trenes y vuelos
        </button>
        : el mapa y la agenda se actualizan. El mapa es un dibujo esquemático, no sirve para
        navegar; la escala en São Paulo queda fuera del recuadro.
      </p>
    </section>
  )
}
