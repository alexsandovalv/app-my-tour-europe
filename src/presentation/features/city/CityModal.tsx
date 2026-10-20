import { useCallback, useEffect, useRef, useState } from 'react'
import type { City } from '../../../domain/trip'
import { Icon } from '../../components/Icon'
import { ExtLink } from '../../components/Links'
import { COUNTRY_COLOR, cssVars } from '../../theme'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

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
    <div className="modal" id="modal">
      <div className="mback" onClick={onClose} />
      <div
        className="mpanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mTitle"
        ref={panelRef}
      >
        <div className="mhead">
          <div>
            <h2 id="mTitle">{city.name}</h2>
            <div className="meta" id="mSub">
              {city.subtitle}
            </div>
          </div>
          <button
            type="button"
            className="mclose"
            id="mClose"
            aria-label="Cerrar"
            ref={closeRef}
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div
          className="track"
          id="track"
          tabIndex={0}
          aria-label="Lugares de la ciudad"
          ref={trackRef}
          onScroll={syncCurrent}
        >
          {city.places.map((place, i) => (
            <article key={place.title} className="slide" aria-label={`${i + 1} de ${total}`}>
              <div className="pic" style={cssVars({ '--cc': COUNTRY_COLOR[city.country] })}>
                <Icon name={place.icon} />
                <span className="pcount">
                  {i + 1} / {total}
                </span>
              </div>
              <div className="cap">
                <h3>{place.title}</h3>
                <p>{place.description}</p>
                <ExtLink
                  href={`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${place.title} ${city.name}`)}`}
                >
                  Ver fotos de este lugar
                </ExtLink>
              </div>
            </article>
          ))}
        </div>
        {total > 1 && (
          <div className="mnav" id="mnav">
            <button
              type="button"
              className="arrow"
              id="mPrev"
              aria-label="Anterior"
              onClick={() => go(current - 1)}
            >
              &#8249;
            </button>
            <div className="dots" id="dots">
              {city.places.map((place, i) => (
                <button
                  key={place.title}
                  type="button"
                  aria-label={`Ir al lugar ${i + 1}`}
                  aria-current={i === current ? 'true' : 'false'}
                  onClick={() => go(i)}
                />
              ))}
            </div>
            <button
              type="button"
              className="arrow"
              id="mNext"
              aria-label="Siguiente"
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
