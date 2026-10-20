import { useCallback, useEffect, useRef, useState } from 'react'
import type { City } from '../../../domain/trip'
import { Icon } from '../../components/Icon'
import { ExtLink } from '../../components/Links'
import { CITY_COLOR, cssVars } from '../../theme'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

const navArrow =
  'size-[38px] cursor-pointer rounded-full border border-line bg-bg text-[1.3rem] leading-none text-ink'

/** Ventana con el carrusel de lugares de una ciudad. */
export function CityModal({ city, onClose }: { city: City; onClose(): void }) {
  const total = city.places.length
  const trackRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const opener = useRef<Element | null>(document.activeElement)
  const [current, setCurrent] = useState(0)

  const go = useCallback(
    (index: number) => {
      const track = trackRef.current
      if (!track) return
      const i = Math.max(0, Math.min(total - 1, index))
      track.scrollTo({
        left: i * track.clientWidth,
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      })
    },
    [total],
  )

  const syncCurrent = () => {
    requestAnimationFrame(() => {
      const track = trackRef.current
      if (!track) return
      const i = Math.round(track.scrollLeft / (track.clientWidth || 1))
      setCurrent(Math.max(0, Math.min(total - 1, i)))
    })
  }

  // Bloquea el scroll de la página y devuelve el foco a quien abrió la ventana.
  useEffect(() => {
    const previous = opener.current
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    return () => {
      document.body.style.overflow = ''
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') go(current - 1)
      else if (e.key === 'ArrowRight') go(current + 1)
      else if (e.key === 'Tab' && panelRef.current) {
        const focusable = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            "button:not([hidden]),a[href],[tabindex='0']",
          ),
        ).filter((el) => el.offsetParent !== null)
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (!first || !last) return
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [current, go, onClose])

  return (
    <div
      id="modal"
      className="fixed inset-0 z-20 flex items-center justify-center px-4 py-[max(16px,env(safe-area-inset-top,0px))]"
    >
      <div className="absolute inset-0 bg-[var(--scrim)]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mTitle"
        className="relative flex max-h-full w-[min(680px,100%)] flex-col overflow-hidden rounded-[10px] border border-line bg-surface"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line px-4 pt-3.5 pb-3">
          <div>
            <h2 id="mTitle" className="text-2xl font-extrabold tracking-tight">
              {city.name}
            </h2>
            <div id="mSub" className="mt-0.5 font-mono text-[.72rem] text-muted">
              {city.subtitle}
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            id="mClose"
            aria-label="Cerrar"
            className="size-9 flex-none cursor-pointer rounded-full border border-line bg-bg text-[1.3rem] leading-none text-ink"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div
          ref={trackRef}
          id="track"
          tabIndex={0}
          aria-label="Lugares de la ciudad"
          className="scrollbar-none flex min-h-0 snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
          onScroll={syncCurrent}
        >
          {city.places.map((place, i) => (
            <article
              key={place.title}
              data-testid="slide"
              aria-label={`${i + 1} de ${total}`}
              className="min-w-0 flex-[0_0_100%] snap-start overflow-y-auto"
            >
              <div
                className="relative grid aspect-[16/8] max-h-[34vh] w-full place-items-center bg-[linear-gradient(135deg,color-mix(in_srgb,var(--cc)_38%,var(--surface)),color-mix(in_srgb,var(--cc)_10%,var(--surface)))]"
                style={cssVars({ '--cc': CITY_COLOR[city.id] })}
              >
                <div className="w-[min(34%,140px)] fill-none stroke-ink stroke-[2.2] opacity-85 [stroke-linecap:round] [stroke-linejoin:round]">
                  <Icon name={place.icon} />
                </div>
                <span className="absolute right-3 bottom-2.5 font-mono text-[.72rem] text-muted">
                  {i + 1} / {total}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-3">
                <h3 className="text-xl font-extrabold">{place.title}</h3>
                <p className="m-0 max-w-[60ch]">{place.description}</p>
                <span className="text-[.88rem] font-medium">
                  <ExtLink
                    href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${place.title} ${city.name}`)}`}
                  >
                    Ver fotos de este lugar
                  </ExtLink>
                </span>
              </div>
            </article>
          ))}
        </div>
        {total > 1 && (
          <div
            id="mnav"
            className="flex items-center justify-between gap-2.5 border-t border-line px-4 pt-2.5 pb-3.5"
          >
            <button
              type="button"
              id="mPrev"
              aria-label="Anterior"
              className={navArrow}
              onClick={() => go(current - 1)}
            >
              &#8249;
            </button>
            <div id="dots" className="flex flex-wrap justify-center gap-1.5">
              {city.places.map((place, i) => (
                <button
                  key={place.title}
                  type="button"
                  aria-label={`Ir al lugar ${i + 1}`}
                  aria-current={i === current ? 'true' : 'false'}
                  className="size-[9px] cursor-pointer rounded-full border-0 bg-line p-0 aria-[current=true]:scale-125 aria-[current=true]:bg-accent"
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button
              type="button"
              id="mNext"
              aria-label="Siguiente"
              className={navArrow}
              onClick={() => go(current + 1)}
            >
              &#8250;
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
