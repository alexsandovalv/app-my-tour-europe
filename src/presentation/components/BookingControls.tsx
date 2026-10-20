import { useState } from 'react'
import { statusOf, type BookingStatus } from '../../domain/booking'
import { isoOfDay } from '../../domain/expenses'
import { formatUsd, usdOf, type Currency } from '../../domain/money'
import { useApp, useAppStore } from '../AppContext'

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

const FIELD =
  'rounded-md border border-line bg-bg px-2 py-[6px] text-[.85rem] text-ink placeholder:text-muted'
const FIELD_LABEL = 'font-mono text-[.72rem] text-muted'

/** Importe realmente pagado y fecha real de una reserva: alimentan el presupuesto, la agenda y el calendario. */
export function RealFields({ itemKey }: { itemKey: string }) {
  const { rate } = useApp()
  const paid = useAppStore((s) => s.booking.paid[itemKey])
  const date = useAppStore((s) => s.booking.dates[itemKey] ?? '')
  const setPaid = useAppStore((s) => s.setPaid)
  const setRealDate = useAppStore((s) => s.setRealDate)
  const [draft, setDraft] = useState<string | null>(null)
  const [pickedCurrency, setPickedCurrency] = useState<Currency>('USD')
  const [invalid, setInvalid] = useState(false)
  const currency = paid?.currency ?? pickedCurrency

  const commit = (raw: string) => {
    const text = raw.trim()
    if (text === '') {
      setPaid(itemKey, null)
      setDraft(null)
      setInvalid(false)
      return
    }
    const amount = Number(text.replace(',', '.'))
    if (Number.isFinite(amount) && setPaid(itemKey, { amount, currency })) {
      setDraft(null)
      setInvalid(false)
    } else {
      setInvalid(true)
    }
  }

  return (
    <div className="mt-2.5 flex flex-wrap items-end gap-x-4 gap-y-2" data-testid="real-fields">
      <label className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Pagué</span>
        <span className="flex gap-1.5">
          <input
            type="text"
            id={`paid-${itemKey}`}
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-label="Importe que pagaste"
            className={`${FIELD} w-24`}
            value={draft ?? (paid ? String(paid.amount) : '')}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              if (draft !== null) commit(e.currentTarget.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e.currentTarget.value)
            }}
          />
          <select
            id={`cur-${itemKey}`}
            aria-label="Moneda en que pagaste"
            className={FIELD}
            value={currency}
            onChange={(e) => {
              const next = e.target.value === 'EUR' ? 'EUR' : 'USD'
              setPickedCurrency(next)
              if (paid) setPaid(itemKey, { amount: paid.amount, currency: next })
            }}
          >
            <option value="USD">US$</option>
            <option value="EUR">EUR</option>
          </select>
        </span>
      </label>
      <label className="flex flex-col gap-1">
        <span className={FIELD_LABEL}>Fecha real</span>
        <input
          type="date"
          id={`date-${itemKey}`}
          min={isoOfDay(1)}
          max={isoOfDay(30)}
          aria-label="Fecha real de la reserva"
          className={FIELD}
          value={date}
          onChange={(e) => setRealDate(itemKey, e.target.value === '' ? null : e.target.value)}
        />
      </label>
      {paid?.currency === 'EUR' && (
        <span className="pb-1.5 text-[.82rem] text-muted" data-testid="paid-usd">
          = {formatUsd(usdOf(paid, rate))}
        </span>
      )}
      {invalid && (
        <span className="basis-full text-[.78rem] text-todo">Escribe un importe mayor que 0</span>
      )}
    </div>
  )
}
