import { useEffect, useRef, useState } from 'react'
import { ACCENTS, THEME_MODES, type AccentId, type ThemeMode } from '../../domain/preferences'
import { useAppStore } from '../AppContext'
import { useIsDark } from '../hooks'
import { MoonIcon, PaletteIcon, SunIcon } from './UiIcons'

const MODE_LABEL: Record<ThemeMode, string> = { light: 'Claro', dark: 'Oscuro', system: 'Sistema' }

const ACCENT_LABEL: Record<AccentId, string> = {
  esmeralda: 'Esmeralda',
  azul: 'Azul',
  violeta: 'Violeta',
  terracota: 'Terracota',
}

/** Color de muestra de cada acento: [claro, oscuro]. El real se aplica con variables CSS. */
const ACCENT_SWATCH: Record<AccentId, readonly [string, string]> = {
  esmeralda: ['#0b6b58', '#4fc2a6'],
  azul: ['#1d5fb4', '#7fb0f0'],
  violeta: ['#6d3fb0', '#b79bea'],
  terracota: ['#b4482a', '#ee8b6e'],
}

const iconButton =
  'inline-flex h-8 w-10 cursor-pointer items-center justify-center text-muted transition-colors hover:bg-soft hover:text-ink aria-expanded:bg-soft aria-expanded:text-ink'

/** Botón día/noche y menú para elegir modo y color de acento. */
export function ThemeControls() {
  const dark = useIsDark()
  const mode = useAppStore((s) => s.theme.mode)
  const accent = useAppStore((s) => s.theme.accent)
  const toggleDark = useAppStore((s) => s.toggleDark)
  const setThemeMode = useAppStore((s) => s.setThemeMode)
  const setAccent = useAppStore((s) => s.setAccent)
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <div className="inline-flex divide-x divide-line overflow-hidden rounded-lg border border-line bg-surface">
        <button
          type="button"
          id="themeToggle"
          className={iconButton}
          aria-pressed={dark}
          aria-label={dark ? 'Cambiar a modo día' : 'Cambiar a modo noche'}
          title={dark ? 'Modo día' : 'Modo noche'}
          onClick={toggleDark}
        >
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <button
          type="button"
          id="themeMenuBtn"
          className={iconButton}
          aria-expanded={open}
          aria-controls="themeMenu"
          aria-label="Personalizar tema"
          title="Personalizar tema"
          onClick={() => setOpen((v) => !v)}
        >
          <PaletteIcon />
        </button>
      </div>
      {open && (
        <div
          id="themeMenu"
          role="dialog"
          aria-label="Personalizar tema"
          className="absolute top-full right-0 z-10 mt-2 flex w-64 flex-col gap-3 rounded-md border border-line bg-surface p-3.5 shadow-lg"
        >
          <div>
            <div className="mb-1.5 font-mono text-[.72rem] text-muted">Modo</div>
            <div
              role="radiogroup"
              aria-label="Modo"
              className="inline-flex w-full overflow-hidden rounded-lg border border-line"
            >
              {THEME_MODES.map((m) => (
                <button
                  key={m}
                  type="button"
                  role="radio"
                  id={`mode-theme-${m}`}
                  aria-checked={m === mode}
                  className="flex-1 cursor-pointer border-0 bg-surface px-2 py-1.5 text-[.82rem] font-semibold text-muted aria-checked:bg-accent aria-checked:text-accent-ink"
                  onClick={() => setThemeMode(m)}
                >
                  {MODE_LABEL[m]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 font-mono text-[.72rem] text-muted">Color de acento</div>
            <div role="radiogroup" aria-label="Color de acento" className="flex gap-2.5">
              {ACCENTS.map((a) => (
                <button
                  key={a}
                  type="button"
                  role="radio"
                  id={`accent-${a}`}
                  aria-checked={a === accent}
                  aria-label={ACCENT_LABEL[a]}
                  title={ACCENT_LABEL[a]}
                  className="size-7 cursor-pointer rounded-full border-2 border-surface outline-1 outline-line aria-checked:outline-2 aria-checked:outline-ink"
                  style={{ backgroundColor: ACCENT_SWATCH[a][dark ? 1 : 0] }}
                  onClick={() => setAccent(a)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
