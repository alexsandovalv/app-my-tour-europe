/**
 * Empaqueta la app en un solo HTML autocontenido (JS y CSS en línea).
 *
 *  - JS: esbuild.
 *  - CSS: se compila Tailwind v4 con su API (`compile`) sobre las clases que aparecen en el código fuente.
 *
 * Salidas en dist-single/:
 *  - index.html     documento completo, se abre con doble clic.
 *  - artifact.html  fragmento (sin doctype/head) listo para publicarse como artefacto de Claude.
 */
import { build, transform } from 'esbuild'
import { createRequire } from 'node:module'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, extname, join, resolve } from 'node:path'
import { compile } from 'tailwindcss'

const OUT = 'dist-single'
const STYLES = 'src/presentation/styles/index.css'
const require = createRequire(import.meta.url)

/** Todos los archivos de código fuente, para extraer las clases que usa la app. */
async function sourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const nested = await Promise.all(
    entries.map((e) => (e.isDirectory() ? sourceFiles(join(dir, e.name)) : [join(dir, e.name)])),
  )
  return nested.flat().filter((f) => ['.ts', '.tsx', '.html'].includes(extname(f)))
}

async function tailwindCss() {
  const root = resolve(dirname(require.resolve('tailwindcss')), '..')
  const compiler = await compile(await readFile(STYLES, 'utf8'), {
    base: dirname(resolve(STYLES)),
    onDependency: () => undefined,
    async loadStylesheet(id, base) {
      const path = id === 'tailwindcss' ? join(root, 'index.css') : resolve(base, id)
      return { path, base: dirname(path), content: await readFile(path, 'utf8') }
    },
  })
  const texts = await Promise.all(
    [...(await sourceFiles('src')), 'index.html'].map((f) => readFile(f, 'utf8')),
  )
  const candidates = new Set(
    texts
      .join('\n')
      .split(/[^\w\-:./[\]()%#,=!@&>_*+]+/)
      .filter(Boolean),
  )
  const css = compiler.build([...candidates])
  return (await transform(css, { loader: 'css', minify: true })).code
}

const css = await tailwindCss()

const result = await build({
  entryPoints: ['src/main.ts'],
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
  // El CSS ya está compilado arriba: el import de la hoja se ignora en este empaquetado.
  plugins: [
    {
      name: 'ignore-css',
      setup(b) {
        b.onLoad({ filter: /\.css$/ }, () => ({ contents: '', loader: 'css' }))
      },
    },
  ],
})

const js = result.outputFiles.find((f) => f.path.endsWith('.js'))?.text
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
const kb = (s) => `${(s.length / 1024).toFixed(0)} KB`
console.log(`dist-single/index.html ${kb(full)} · artifact.html ${kb(fragment)} · CSS ${kb(css)}`)
