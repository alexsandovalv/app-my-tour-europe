import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { project, MAP_VIEWBOX } from '../src/presentation/features/map/projection'

describe('proyección del mapa', () => {
  it('Madrid, Vigo y París caen dentro del recuadro', () => {
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
