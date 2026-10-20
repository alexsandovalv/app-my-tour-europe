/** Proyección plana (lon, lat) → píxeles del SVG. Es un dibujo esquemático, no un mapa para navegar. */
export const MAP_VIEWBOX = { width: 1110, height: 567 } as const

const LON0 = -14.4
const LAT1 = 49.9
const SCALE = 52
const KX = Math.cos((43.5 * Math.PI) / 180)

export function project(lon: number, lat: number): readonly [number, number] {
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

/** Tramo recto o, para vuelos, una curva cuadrática que se arquea hacia el norte. */
export function legPath(
  from: readonly [number, number],
  to: readonly [number, number],
  air: boolean,
  bow = 0.2,
): string {
  const [px, py] = from
  const [qx, qy] = to
  if (!air) return `M${fmt(px)} ${fmt(py)}L${fmt(qx)} ${fmt(qy)}`
  const mx = (px + qx) / 2
  const my = (py + qy) / 2
  const dx = qx - px
  const dy = qy - py
  const len = Math.hypot(dx, dy) || 1
  let nx = -dy / len
  let ny = dx / len
  if (ny > 0) {
    nx = -nx
    ny = -ny
  }
  return `M${fmt(px)} ${fmt(py)}Q${fmt(mx + nx * len * bow)} ${fmt(my + ny * len * bow)} ${fmt(qx)} ${fmt(qy)}`
}
