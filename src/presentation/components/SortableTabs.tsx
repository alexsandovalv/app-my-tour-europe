import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { TabId } from '../../domain/tabs'

export interface TabItem {
  readonly id: TabId
  readonly label: string
}

interface Props {
  /** Pestañas ya en el orden en que se muestran. */
  readonly tabs: readonly TabItem[]
  readonly selected: TabId
  onSelect(id: TabId): void
  onMove(id: TabId, toIndex: number): void
  onShift(id: TabId, delta: number): void
}

/** Pixeles que hay que mover el ratón antes de que un clic se convierta en arrastre. */
const MOUSE_THRESHOLD = 5
/** En pantallas táctiles el arrastre empieza con una pulsación larga; moverse antes es desplazarse. */
const LONG_PRESS_MS = 350
const TOUCH_TOLERANCE = 8
/** Separación entre pestañas (gap-0.5). */
const GAP = 2
/** Zona junto a los bordes donde la barra se desplaza sola mientras se arrastra. */
const EDGE = 36
const SCROLL_STEP = 10

interface Pending {
  readonly id: TabId
  readonly el: HTMLElement
  readonly pointerId: number
  readonly type: string
  readonly startX: number
  readonly startY: number
  lastX: number
  timer: ReturnType<typeof setTimeout> | undefined
}

interface Active {
  readonly id: TabId
  readonly from: number
  readonly rects: ReadonlyArray<{ left: number; width: number }>
  readonly startContentX: number
  over: number
  lastX: number
  raf: number
}

interface DragView {
  readonly id: TabId
  readonly from: number
  readonly over: number
  readonly dx: number
  readonly width: number
}

/**
 * Barra de pestañas que se reordena arrastrando. Sin librerías: eventos de puntero.
 * - Ratón: arrastrar tras mover unos pixeles; un clic sin mover selecciona la pestaña.
 * - Táctil: pulsación larga y luego arrastrar; deslizar sin esperar desplaza la barra.
 * - Teclado: Alt + flecha izquierda o derecha mueve la pestaña enfocada.
 */
export function SortableTabs({ tabs, selected, onSelect, onMove, onShift }: Props) {
  const nav = useRef<HTMLElement>(null)
  const pending = useRef<Pending | null>(null)
  const active = useRef<Active | null>(null)
  const suppressClick = useRef(false)
  const latest = useRef({ tabs, onMove })
  latest.current = { tabs, onMove }
  const [view, setView] = useState<DragView | null>(null)
  const [announcement, setAnnouncement] = useState('')

  const announce = (id: TabId, index: number) => {
    const label = latest.current.tabs.find((t) => t.id === id)?.label ?? id
    setAnnouncement(`${label}: posición ${index + 1} de ${latest.current.tabs.length}`)
  }

  const contentX = (clientX: number): number => {
    const el = nav.current
    return el ? clientX - el.getBoundingClientRect().left + el.scrollLeft : clientX
  }

  /** Recalcula dónde caería la pestaña arrastrada según la posición del puntero. */
  const update = (clientX: number) => {
    const a = active.current
    const el = nav.current
    if (!a || !el) return
    a.lastX = clientX
    const origin = a.rects[a.from]
    if (!origin) return
    const raw = contentX(clientX) - a.startContentX
    const dx = Math.max(-origin.left, Math.min(el.scrollWidth - origin.left - origin.width, raw))
    // Se compara el borde delantero (el que va por delante según la dirección) con el centro de cada vecina:
    // así se puede llegar a los extremos aunque la pestaña arrastrada sea más ancha que sus vecinas.
    const leading = origin.left + dx
    const trailing = origin.left + origin.width + dx
    let over = a.from
    a.rects.forEach((r, j) => {
      const c = r.left + r.width / 2
      if (j > a.from && trailing > c) over = Math.max(over, j)
      if (j < a.from && leading < c) over = Math.min(over, j)
    })
    a.over = over
    setView({ id: a.id, from: a.from, over, dx, width: origin.width })
  }

  const autoScroll = () => {
    const a = active.current
    const el = nav.current
    if (!a || !el) return
    const box = el.getBoundingClientRect()
    let step = 0
    if (a.lastX < box.left + EDGE) step = -SCROLL_STEP
    else if (a.lastX > box.right - EDGE) step = SCROLL_STEP
    if (step !== 0) {
      const before = el.scrollLeft
      el.scrollLeft += step
      if (el.scrollLeft !== before) update(a.lastX)
    }
    a.raf = requestAnimationFrame(autoScroll)
  }

  const cancelPending = () => {
    if (pending.current?.timer) clearTimeout(pending.current.timer)
    pending.current = null
  }

  const activate = (p: Pending) => {
    const el = nav.current
    if (!el || active.current) return
    const buttons = Array.from(el.querySelectorAll<HTMLElement>('[role="tab"]'))
    const from = buttons.indexOf(p.el)
    if (from === -1) return
    if (p.timer) clearTimeout(p.timer)
    pending.current = null
    active.current = {
      id: p.id,
      from,
      rects: buttons.map((b) => ({ left: b.offsetLeft, width: b.offsetWidth })),
      startContentX: contentX(p.startX),
      over: from,
      lastX: p.lastX,
      raf: 0,
    }
    suppressClick.current = true
    try {
      p.el.setPointerCapture(p.pointerId)
    } catch {
      /* el puntero ya no existe */
    }
    update(p.lastX)
    active.current.raf = requestAnimationFrame(autoScroll)
  }

  const finish = (commit: boolean) => {
    cancelPending()
    const a = active.current
    if (!a) return
    cancelAnimationFrame(a.raf)
    active.current = null
    setView(null)
    if (commit && a.over !== a.from) {
      latest.current.onMove(a.id, a.over)
      announce(a.id, a.over)
    }
    // El clic que sigue al soltar no debe seleccionar la pestaña.
    setTimeout(() => {
      suppressClick.current = false
    }, 0)
  }

  // Un arrastre táctil activo no debe desplazar la barra: hace falta un oyente que no sea pasivo.
  useEffect(() => {
    const el = nav.current
    if (!el) return
    const block = (e: TouchEvent) => {
      if (active.current && e.cancelable) e.preventDefault()
    }
    el.addEventListener('touchmove', block, { passive: false })
    return () => {
      el.removeEventListener('touchmove', block)
      if (active.current) cancelAnimationFrame(active.current.raf)
      cancelPending()
    }
  }, [])

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>, id: TabId) => {
    if (active.current || (e.pointerType === 'mouse' && e.button !== 0)) return
    cancelPending()
    const p: Pending = {
      id,
      el: e.currentTarget,
      pointerId: e.pointerId,
      type: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      timer: undefined,
    }
    if (e.pointerType === 'touch') p.timer = setTimeout(() => activate(p), LONG_PRESS_MS)
    pending.current = p
  }

  const onPointerMove = (e: PointerEvent<HTMLButtonElement>) => {
    if (active.current) {
      update(e.clientX)
      return
    }
    const p = pending.current
    if (!p || p.pointerId !== e.pointerId) return
    p.lastX = e.clientX
    const dist = Math.hypot(e.clientX - p.startX, e.clientY - p.startY)
    if (p.type === 'touch') {
      if (dist > TOUCH_TOLERANCE) cancelPending()
    } else if (dist > MOUSE_THRESHOLD) {
      activate(p)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, id: TabId, index: number) => {
    if (!e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return
    e.preventDefault()
    const delta = e.key === 'ArrowLeft' ? -1 : 1
    const target = Math.max(0, Math.min(tabs.length - 1, index + delta))
    if (target === index) return
    onShift(id, delta)
    announce(id, target)
    // Mover el nodo en el DOM puede quitarle el foco: se devuelve en el siguiente cuadro.
    requestAnimationFrame(() => document.getElementById(`tab-${id}`)?.focus())
  }

  const shiftOf = (id: TabId, index: number): number => {
    if (!view) return 0
    if (id === view.id) return view.dx
    if (view.from < view.over && index > view.from && index <= view.over) return -(view.width + GAP)
    if (view.from > view.over && index >= view.over && index < view.from) return view.width + GAP
    return 0
  }

  return (
    <>
      <nav
        ref={nav}
        className={`scrollbar-none relative mt-2.5 flex gap-0.5 overflow-x-auto select-none ${view ? 'cursor-grabbing' : ''}`}
        role="tablist"
        aria-label="Secciones"
        data-dragging={view !== null}
      >
        {tabs.map((t, index) => {
          const dragged = view?.id === t.id
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              data-tab={t.id}
              data-dragging={dragged}
              aria-selected={t.id === selected}
              aria-controls={`p-${t.id}`}
              aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
              title="Arrastra para reordenar (Alt + ← →)"
              className="cursor-pointer border-0 border-b-[3px] border-transparent bg-transparent px-3 py-2.5 text-[.9rem] font-semibold whitespace-nowrap text-muted aria-selected:border-accent aria-selected:text-ink"
              style={{
                transform: view ? `translateX(${shiftOf(t.id, index)}px)` : undefined,
                transition: view && !dragged ? 'transform 150ms ease' : 'none',
                ...(dragged
                  ? {
                      position: 'relative',
                      zIndex: 2,
                      background: 'var(--surface)',
                      borderRadius: 6,
                      boxShadow: '0 6px 18px rgb(0 0 0 / 0.22)',
                      cursor: 'grabbing',
                    }
                  : null),
              }}
              onClick={(e) => {
                if (suppressClick.current) {
                  e.preventDefault()
                  return
                }
                onSelect(t.id)
              }}
              onPointerDown={(e) => onPointerDown(e, t.id)}
              onPointerMove={onPointerMove}
              onPointerUp={() => finish(true)}
              onPointerCancel={() => finish(false)}
              onLostPointerCapture={() => finish(false)}
              onContextMenu={(e) => {
                if (pending.current || active.current) e.preventDefault()
              }}
              onKeyDown={(e) => onKeyDown(e, t.id, index)}
            >
              {t.label}
            </button>
          )
        })}
      </nav>
      <div role="status" aria-live="polite" className="sr-only" id="tabsAnnounce">
        {announcement}
      </div>
    </>
  )
}
