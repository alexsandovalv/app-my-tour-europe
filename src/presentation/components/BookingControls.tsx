import { useState } from 'react'
import { statusOf } from '../../domain/booking'
import { useApp, useBookingState } from '../AppContext'

export function StatusButton({ itemKey }: { itemKey: string }) {
  const { bookings } = useApp()
  const status = statusOf(useBookingState(), itemKey)
  return (
    <button
      type="button"
      className="sel"
      id={`sel-${itemKey}`}
      data-s={status}
      aria-label={`Estado de la reserva: ${status}. Pulsa para cambiar.`}
      onClick={() => bookings.cycleStatus(itemKey)}
    >
      {status}
    </button>
  )
}

/** Campo para pegar el enlace de la reserva propia; valida y guarda al salir o al pegar. */
export function PasteBox({ itemKey }: { itemKey: string }) {
  const { bookings } = useApp()
  const saved = useBookingState().links[itemKey] ?? ''
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  const commit = (raw: string) => {
    if (bookings.setLink(itemKey, raw)) {
      setDraft(null)
      setInvalid(false)
    } else {
      setInvalid(true)
    }
  }

  return (
    <div className="paste">
      <input
        className="lnk"
        type="url"
        id={`lnk-${itemKey}`}
        inputMode="url"
        autoComplete="off"
        placeholder="Pega aquí el link de tu reserva"
        aria-label="Link de tu reserva"
        value={draft ?? saved}
        onChange={(e) => setDraft(e.target.value)}
        onPaste={(e) => {
          const el = e.currentTarget
          setTimeout(() => commit(el.value), 0)
        }}
        onBlur={(e) => {
          if (draft !== null) commit(e.currentTarget.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit(e.currentTarget.value)
        }}
      />
      {saved && (
        <a className="open" id={`open-${itemKey}`} href={saved} target="_blank" rel="noopener">
          Abrir mi reserva
        </a>
      )}
      {saved && (
        <button
          type="button"
          className="clr"
          id={`clr-${itemKey}`}
          aria-label="Quitar link"
          onClick={() => {
            bookings.clearLink(itemKey)
            setDraft(null)
            setInvalid(false)
          }}
        >
          &times;
        </button>
      )}
      {invalid && <span className="err">Pega un link completo, que empiece con https://</span>}
    </div>
  )
}
