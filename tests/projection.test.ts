import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { legGeometry, MAP_VIEWBOX, project } from '../src/presentation/features/map/projection'

describe('proyección del mapa', () => {
  it('las ciudades caen dentro del recuadro', () => {
    for (const [lon, lat] of [
      [-3.7, 40.42],
      [-8.72, 42.24],
      [2.35, 48.86],
      [12.5, 41.9],
    ] as const) {
      const [x, y] = project(lon, lat)
      assert.ok(x > 0 && x < MAP_VIEWBOX.width, `x ${x}`)
      assert.ok(y > 0 && y < MAP_VIEWBOX.height, `y ${y}`)
    }
  })

  it('Vigo queda al oeste y al norte de Madrid', () => {
    const [mx, my] = project(-3.7, 40.42)
    const [vx, vy] = project(-8.72, 42.24)
    assert.ok(vx < mx && vy < my)
  })
})

describe('geometría de los tramos', () => {
  const a = [100, 400] as const
  const b = [500, 400] as const

  it('un tramo sin curvar es una recta con la flecha apuntando al destino', () => {
    const g = legGeometry(a, b, false)
    assert.match(g.d, /^M100\.0 400\.0L500\.0 400\.0$/)
    const mid = g.at(0.5)
    assert.equal(Math.round(mid.x), 300)
    assert.equal(Math.round(mid.angle), 0) // hacia la derecha
    assert.equal(Math.round(legGeometry(b, a, false).at(0.5).angle), 180)
  })

  it('un vuelo se arquea hacia el norte y la flecha sigue la curva', () => {
    const g = legGeometry(a, b, true, 0.2)
    assert.match(g.d, /Q/)
    assert.ok(g.at(0.5).y < 400) // y menor = más al norte
    assert.ok(g.at(0.9).angle > 0) // la curva baja hacia el destino
  })

  it('el número queda a un lado de la línea, no encima', () => {
    const g = legGeometry(a, b, false)
    const [bx, by] = g.beside(0.5, 15)
    assert.equal(Math.round(bx), 300)
    assert.equal(Math.round(Math.abs(by - 400)), 15)
  })
})
