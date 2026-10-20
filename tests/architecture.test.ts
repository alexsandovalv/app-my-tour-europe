import assert from 'node:assert/strict'
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { describe, it } from 'node:test'

/**
 * Regla de dependencia de la arquitectura limpia, verificada sobre el código real:
 *   domain  → (nada)
 *   application → domain
 *   infrastructure → application, domain
 *   presentation → application, domain  (la infraestructura entra solo vía composition.ts)
 */
const SRC = resolve('src')
type Layer = 'domain' | 'application' | 'infrastructure' | 'presentation' | 'composition'

const ALLOWED: Record<Layer, readonly Layer[]> = {
  domain: ['domain'],
  application: ['application', 'domain'],
  infrastructure: ['infrastructure', 'application', 'domain'],
  presentation: ['presentation', 'application', 'domain', 'composition'],
  composition: ['composition', 'application', 'domain', 'infrastructure'],
}

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name)
    return statSync(full).isDirectory() ? files(full) : /\.(ts|tsx)$/.test(name) ? [full] : []
  })
}

function layerOf(file: string): Layer {
  const top = relative(SRC, file).split(sep)[0] ?? ''
  if (top === 'composition.ts') return 'composition'
  return top as Layer
}

function importsOf(file: string): string[] {
  const source = readFileSync(file, 'utf8')
  return [
    ...source.matchAll(
      /(?:import|export)[^'"]*?from\s+['"]([^'"]+)['"]|import\s+['"]([^'"]+)['"]/g,
    ),
  ]
    .map((m) => m[1] ?? m[2] ?? '')
    .filter(Boolean)
}

describe('regla de dependencia', () => {
  const all = files(SRC)

  it('hay código en cada capa', () => {
    for (const layer of ['domain', 'application', 'infrastructure', 'presentation'] as const) {
      assert.ok(
        all.some((f) => layerOf(f) === layer),
        layer,
      )
    }
  })

  it('cada capa solo importa de las capas permitidas', () => {
    const violations: string[] = []
    for (const file of all) {
      const from = layerOf(file)
      for (const spec of importsOf(file)) {
        if (!spec.startsWith('.')) continue
        const target = layerOf(resolve(dirname(file), spec))
        if (!ALLOWED[from].includes(target)) {
          violations.push(`${relative(SRC, file)} (${from}) importa ${spec} (${target})`)
        }
      }
    }
    assert.deepEqual(violations, [])
  })

  it('dominio y aplicación no usan React ni APIs del navegador', () => {
    const offenders: string[] = []
    for (const file of all.filter((f) => ['domain', 'application'].includes(layerOf(f)))) {
      const source = readFileSync(file, 'utf8')
      if (/from\s+['"]react/.test(source)) offenders.push(`${relative(SRC, file)}: react`)
      if (
        /\b(window|document|localStorage)\b/.test(source.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, ''))
      ) {
        offenders.push(`${relative(SRC, file)}: API del navegador`)
      }
    }
    assert.deepEqual(offenders, [])
  })
})
