import { useState } from 'react'
import { statusOf, type BookingStatus } from '../../domain/booking'
import { useAppStore } from '../AppContext'

const STATUS_STYLE: Record<BookingStatus, string> = {
  'Por reservar': 'bg-todo-bg text-todo',
  Reservado: 'bg-res-bg text-res',
  Pagado: 'bg-paid-bg text-paid',
}

export function StatusButton({ itemKey }: { itemKey: string }) {
  const status = useAppStore((s) => statusOf(s.booking, itemKey))
  const cycleStatus = useAppStore((s) => s.cycleStatus)
  return (
    <button
      type="button"
      id={`sel-${itemKey}`}
      data-s={status}
      aria-label={`Estado de la reserva: ${status}. Pulsa para cambiar.`}
      className={`cursor-pointer justify-self-start whitespace-nowrap rounded-full border-0 px-2.5 py-1.5 text-[.8rem] font-semibold ${STATUS_STYLE[status]}`}
      onClick={() => cycleStatus(itemKey)}
    >
      {status}
    </button>
  )
}

/** Campo para pegar el enlace de la reserva propia; valida y guarda al salir o al pegar. */
export function PasteBox({ itemKey }: { itemKey: string }) {
  const saved = useAppStore((s) => s.booking.links[itemKey] ?? '')
  const setLink = useAppStore((s) => s.setLink)
  const clearLink = useAppStore((s) => s.clearLink)
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  const commit = (raw: string) => {
    if (setLink(itemKey, raw)) {
      setDraft(null)
      setInvalid(false)
    } else {
      setInvalid(true)
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
      <input
        type="url"
        id={`lnk-${itemKey}`}
        inputMode="url"
        autoComplete="off"
        placeholder="Pega aquí el link de tu reserva"
        aria-label="Link de tu reserva"
        className="min-w-0 flex-[1_1_220px] rounded-md border border-line bg-bg px-2.5 py-[7px] text-[.85rem] text-ink placeholder:text-muted"
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
        <a
          id={`open-${itemKey}`}
          href={saved}
          target="_blank"
          rel="noopener"
          className="text-[.85rem] font-semibold whitespace-nowrap"
        >
          Abrir mi reserva
        </a>
      )}
      {saved && (
        <button
          type="button"
          id={`clr-${itemKey}`}
          aria-label="Quitar link"
          className="cursor-pointer border-0 bg-transparent px-1.5 py-0.5 text-xl leading-none text-muted"
          onClick={() => {
            clearLink(itemKey)
            setDraft(null)
            setInvalid(false)
          }}
        >
          &times;
        </button>
      )}
      {invalid && (
        <span className="basis-full text-[.78rem] text-todo">
          Pega un link completo, que empiece con https://
        </span>
      )}
    </div>
  )
}
