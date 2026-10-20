import { useMemo, useState } from 'react'
import type { BudgetReport } from '../../../domain/budget'
import { weekdayShort } from '../../../domain/calendar'
import {
  dayOfIso,
  EXPENSE_CATEGORIES,
  EXPENSE_LABEL,
  isoOfDay,
  type Expense,
  type ExpenseCategory,
} from '../../../domain/expenses'
import { formatUsd, usdOf, type Currency } from '../../../domain/money'
import { useApp, useAppStore } from '../../AppContext'
import { ui } from '../../ui'

const FIELD =
  'rounded-md border border-line bg-bg px-2.5 py-[7px] text-[.88rem] text-ink placeholder:text-muted'
const LABEL = 'flex min-w-0 flex-col gap-1 font-mono text-[.72rem] text-muted'
const BTN =
  'cursor-pointer rounded-md border border-line bg-surface px-3 py-[7px] text-[.85rem] font-semibold text-ink hover:border-accent'

/** Hoy si cae dentro del viaje; si no, el primer día. */
function defaultDate(firstDay: number): string {
  const now = new Date()
  const inNovember = now.getFullYear() === 2026 && now.getMonth() === 10
  return isoOfDay(inNovember ? now.getDate() : firstDay)
}

const shortDate = (iso: string): string => `${weekdayShort(dayOfIso(iso))} ${dayOfIso(iso)} nov`

/** Formulario de gastos del día a día y su lista, con editar y borrar. */
export function ExpenseLog({ report }: { report: BudgetReport }) {
  const { trip, rate } = useApp()
  const expenses = useAppStore((s) => s.booking.expenses)
  const addExpense = useAppStore((s) => s.addExpense)
  const updateExpense = useAppStore((s) => s.updateExpense)
  const removeExpense = useAppStore((s) => s.removeExpense)

  const [date, setDate] = useState(() => defaultDate(trip.firstDay))
  const [category, setCategory] = useState<ExpenseCategory>('comida')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('USD')
  const [editing, setEditing] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [touchedDay, setTouchedDay] = useState<number | null>(null)

  const sorted = useMemo(
    () => [...expenses].sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id)),
    [expenses],
  )

  const reset = () => {
    setEditing(null)
    setDescription('')
    setAmount('')
    setError(null)
  }

  const submit = () => {
    const value = Number(amount.trim().replace(',', '.'))
    if (!Number.isFinite(value) || value <= 0) {
      setError('Escribe un importe mayor que 0.')
      return
    }
    const draft = { date, category, description, amount: value, currency }
    const ok = editing ? updateExpense(editing, draft) : addExpense(draft) !== null
    if (!ok) {
      setError('Revisa la fecha (noviembre de 2026) y el importe.')
      return
    }
    setTouchedDay(dayOfIso(date))
    reset()
  }

  const edit = (e: Expense) => {
    setEditing(e.id)
    setDate(e.date)
    setCategory(e.category)
    setDescription(e.description)
    setAmount(String(e.amount))
    setCurrency(e.currency)
    setError(null)
  }

  const dayInfo = touchedDay === null ? null : report.daily.find((d) => d.day === touchedDay)

  return (
    <section aria-labelledby="exp-h" className="flex flex-col gap-3">
      <h2 id="exp-h" className={ui.subH}>
        Registro de gastos
      </h2>
      <form
        className={`${ui.card} grid grid-cols-2 gap-x-3 gap-y-2.5 p-3.5 sm:grid-cols-[9rem_10rem_minmax(0,1fr)]`}
        onSubmit={(e: { preventDefault(): void }) => {
          e.preventDefault()
          submit()
        }}
      >
        <label className={LABEL}>
          Fecha
          <input
            id="exp-date"
            type="date"
            className={FIELD}
            min={isoOfDay(1)}
            max={isoOfDay(30)}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className={LABEL}>
          Categoría
          <select
            id="exp-cat"
            className={FIELD}
            value={category}
            onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {EXPENSE_LABEL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${LABEL} col-span-2 sm:col-span-1`}>
          Descripción (opcional)
          <input
            id="exp-desc"
            type="text"
            maxLength={80}
            autoComplete="off"
            placeholder="Almuerzo, metro, imán…"
            className={FIELD}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
        <label className={LABEL}>
          Monto
          <input
            id="exp-amount"
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            className={FIELD}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className={LABEL}>
          Moneda
          <select
            id="exp-cur"
            className={FIELD}
            value={currency}
            onChange={(e) => setCurrency(e.target.value === 'EUR' ? 'EUR' : 'USD')}
          >
            <option value="USD">US$</option>
            <option value="EUR">EUR</option>
          </select>
        </label>
        <div className="col-span-2 flex flex-wrap items-end gap-2 sm:col-span-1">
          <button
            id="exp-save"
            type="submit"
            className="cursor-pointer rounded-md border-0 bg-accent px-4 py-[8px] text-[.88rem] font-semibold text-accent-ink"
          >
            {editing ? 'Guardar cambios' : 'Agregar gasto'}
          </button>
          {editing && (
            <button id="exp-cancel" type="button" className={BTN} onClick={reset}>
              Cancelar
            </button>
          )}
        </div>
        {error && (
          <p className="col-span-full m-0 text-[.8rem] text-todo" role="alert" id="exp-error">
            {error}
          </p>
        )}
        {dayInfo && !error && (
          <p
            className={`col-span-full m-0 text-[.82rem] ${dayInfo.over ? 'font-semibold text-todo' : 'text-muted'}`}
            id="exp-day"
            aria-live="polite"
          >
            {dayInfo.over
              ? `Con este gasto llevas ${formatUsd(dayInfo.spent)} el ${shortDate(isoOfDay(dayInfo.day))}: te pasas del tope de ${formatUsd(report.dailyCap)}.`
              : `Ese día llevas ${formatUsd(dayInfo.spent)} de tu tope de ${formatUsd(report.dailyCap)}.`}
          </p>
        )}
      </form>

      {sorted.length === 0 ? (
        <p className={ui.note}>
          Aún no registras gastos. Los de comida, transporte local, souvenirs e imprevistos suman al
          presupuesto; lo pagado en hospedaje, traslados y entradas se anota en cada reserva.
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1.5 p-0" id="expList">
          {sorted.map((e) => (
            <li
              key={e.id}
              data-testid="expense"
              className={`${ui.card} grid grid-cols-[4.6rem_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-3 py-2 max-sm:grid-cols-[minmax(0,1fr)_auto]`}
            >
              <span className="font-mono text-[.75rem] text-muted max-sm:col-span-2">
                {shortDate(e.date)}
              </span>
              <span className="min-w-0 text-[.9rem]">
                <b className="font-semibold">{EXPENSE_LABEL[e.category]}</b>
                {e.description && <span className="text-muted"> · {e.description}</span>}
              </span>
              <span className="flex items-center gap-2.5 justify-self-end">
                <span className="font-mono text-[.85rem] font-semibold whitespace-nowrap">
                  {e.currency === 'USD' ? formatUsd(e.amount) : formatUsd(e.amount).slice(3)}
                  {e.currency === 'EUR' && (
                    <span className="font-normal text-muted">
                      {' '}
                      EUR ≈ {formatUsd(usdOf(e, rate))}
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  id={`exp-edit-${e.id}`}
                  className="cursor-pointer border-0 bg-transparent p-0 text-[.8rem] text-accent underline"
                  onClick={() => edit(e)}
                >
                  Editar
                </button>
                <button
                  type="button"
                  id={`exp-del-${e.id}`}
                  aria-label="Borrar gasto"
                  className="cursor-pointer border-0 bg-transparent px-1 py-0 text-xl leading-none text-muted"
                  onClick={() => {
                    if (editing === e.id) reset()
                    removeExpense(e.id)
                  }}
                >
                  &times;
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
