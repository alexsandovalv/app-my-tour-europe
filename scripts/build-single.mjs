/**
 * Empaqueta la app en un solo HTML autocontenido (JS y CSS en línea) con esbuild.
 *
 * Salidas en dist-single/:
 *  - index.html    documento completo, se abre con doble clic.
 *  - artifact.html fragmento (sin doctype/head) listo para publicarse como artefacto de Claude.
 */
import { build } from 'esbuild'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

const OUT = 'dist-single'

const result = await build({
  entryPoints: ['src/presentation/main.tsx'],
  bundle: true,
  minify: true,
  format: 'iife',
  target: 'es2020',
  jsx: 'automatic',
  define: { 'process.env.NODE_ENV': '"production"' },
  legalComments: 'none',
  outdir: OUT,
  write: false,
  logLevel: 'warning',
})

const js = result.outputFiles.find((f) => f.path.endsWith('.js'))?.text
const css = result.outputFiles.find((f) => f.path.endsWith('.css'))?.text ?? ''
if (!js) throw new Error('esbuild no produjo JavaScript')

// Evita cerrar el <script> en línea por accidente.
const safeJs = js.replace(/<\/script/gi, '<\\/script')

const template = await readFile('index.html', 'utf8')
const title = /<title>(.*?)<\/title>/s.exec(template)?.[1] ?? 'App'
const links = [...template.matchAll(/<link [^>]*>/g)].map((m) => m[0]).join('\n')

const full = template
  .replace(/<script type="module"[^>]*><\/script>/, '')
  // Reemplazo con función: el JS minificado contiene "$&" y "$'" que String.replace interpretaría.
  .replace('</head>', () => `<style>\n${css}</style>\n</head>`)
  .replace('</body>', () => `<script>\n${safeJs}</script>\n</body>`)

const fragment = [
  `<title>${title}</title>`,
  links,
  `<style>\n${css}</style>`,
  '<div id="root"></div>',
  `<script>\n${safeJs}</script>`,
  '',
].join('\n')

await mkdir(OUT, { recursive: true })
await writeFile(`${OUT}/index.html`, full)
await writeFile(`${OUT}/artifact.html`, fragment)
console.log(
  `dist-single/index.html ${(full.length / 1024).toFixed(0)} KB · artifact.html ${(fragment.length / 1024).toFixed(0)} KB`,
)
