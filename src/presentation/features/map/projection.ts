/** Proyección plana (lon, lat) → píxeles del SVG. Es un dibujo esquemático, no un mapa para navegar. */
export const MAP_VIEWBOX = { width: 1110, height: 567 } as const

const LON0 = -14.4
const LAT1 = 49.9
const SCALE = 52
const KX = Math.cos((43.5 * Math.PI) / 180)

export type Point = readonly [number, number]

export function project(lon: number, lat: number): Point {
  return [(lon - LON0) * KX * SCALE, (LAT1 - lat) * SCALE]
}

const fmt = (v: number): string => v.toFixed(1)

export function polygonPath(points: ReadonlyArray<readonly [number, number]>): string {
  return `M${points
    .map(([lon, lat]) => {
      const [x, y] = project(lon, lat)
      return `${fmt(x)} ${fmt(y)}`
    })
    .join('L')}Z`
}

export interface PathPoint {
  readonly x: number
  readonly y: number
  /** Dirección de avance en grados, para orientar una flecha. */
  readonly angle: number
}

export interface LegGeometry {
  readonly d: string
  readonly length: number
  /** Punto de la curva y su dirección, con t entre 0 (origen) y 1 (destino). */
  at(t: number): PathPoint
  /** Punto desplazado de la línea, a `distance` px hacia un lado, para colocar la numeración. */
  beside(t: number, distance: number): Point
}

/**
 * Tramo entre dos ciudades como curva cuadrática. Sin `curved` es una recta
 * (control en el punto medio); con `curved` se arquea hacia el norte según `bow`.
 */
export function legGeometry(from: Point, to: Point, curved: boolean, bow = 0.2): LegGeometry {
  const [px, py] = from
  const [qx, qy] = to
  const dx = qx - px
  const dy = qy - py
  const length = Math.hypot(dx, dy) || 1
  let nx = -dy / length
  let ny = dx / length
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  const k = curved ? bow : 0
  const cx = (px + qx) / 2 + nx * length * k
  const cy = (py + qy) / 2 + ny * length * k

  const point = (t: number): Point => [
    (1 - t) ** 2 * px + 2 * (1 - t) * t * cx + t ** 2 * qx,
    (1 - t) ** 2 * py + 2 * (1 - t) * t * cy + t ** 2 * qy,
  ]
  const tangent = (t: number): Point => [
    2 * (1 - t) * (cx - px) + 2 * t * (qx - cx),
    2 * (1 - t) * (cy - py) + 2 * t * (qy - cy),
  ]

  return {
    d: curved
      ? `M${fmt(px)} ${fmt(py)}Q${fmt(cx)} ${fmt(cy)} ${fmt(qx)} ${fmt(qy)}`
      : `M${fmt(px)} ${fmt(py)}L${fmt(qx)} ${fmt(qy)}`,
    length,
    at(t) {
      const [x, y] = point(t)
      const [tx, ty] = tangent(t)
      return { x, y, angle: (Math.atan2(ty, tx) * 180) / Math.PI }
    },
    beside(t, distance) {
      const [x, y] = point(t)
      const [tx, ty] = tangent(t)
      const tl = Math.hypot(tx, ty) || 1
      return [x + (-ty / tl) * distance, y + (tx / tl) * distance]
    },
  }
}
