import { useState } from 'react'
import { computeBudget, DAILY_ALLOWANCE, type BudgetReport } from '../../../domain/budget'
import { weekdayShort } from '../../../domain/calendar'
import type { BudgetSettings } from '../../../domain/expenses'
import { formatUsd } from '../../../domain/money'
import { useApp, useAppStore } from '../../AppContext'
import { ui } from '../../ui'
import { CategoryChart, DailyChart } from './BudgetCharts'
import { ExpenseLog } from './ExpenseLog'

const signed = (n: number): string => (n < 0 ? `−${formatUsd(-n)}` : formatUsd(n))

function Stat({
  id,
  label,
  value,
  note,
  warn = false,
}: {
  id: string
  label: string
  value: string
  note?: string
  warn?: boolean
}) {
  return (
    <div className={`${ui.card} flex min-w-0 flex-col gap-0.5 px-3.5 py-3`} data-testid="stat">
      <span className="font-mono text-[.7rem] text-muted">{label}</span>
      <b
        id={id}
        className={`font-display text-[1.45rem] leading-tight font-extrabold ${warn ? 'text-todo' : ''}`}
      >
        {value}
      </b>
      {note && <span className="text-[.75rem] text-muted">{note}</span>}
    </div>
  )
}

/** Campo numérico que guarda al salir o con Enter; vacío vuelve al valor sugerido. */
function SettingField({
  id,
  label,
  field,
  value,
  suggested,
  custom,
  hint,
}: {
  id: string
  label: string
  field: keyof BudgetSettings
  value: number
  suggested: number
  custom: boolean
  hint: string
}) {
  const setBudget = useAppStore((s) => s.setBudget)
  const [draft, setDraft] = useState<string | null>(null)
  const [invalid, setInvalid] = useState(false)

  const commit = (raw: string) => {
    const text = raw.trim().replace(',', '.')
    const ok = text === '' ? setBudget(field, null) : setBudget(field, Number(text))
    setInvalid(!ok)
    if (ok) setDraft(null)
  }

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <label htmlFor={id} className="font-mono text-[.72rem] text-muted">
        {label}
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1 rounded-md border border-line bg-bg pl-2.5">
          <span className="text-[.85rem] text-muted">US$</span>
          <input
            id={id}
            type="text"
            inputMode="decimal"
            autoComplete="off"
            placeholder={String(suggested)}
            className="w-24 border-0 bg-transparent px-1.5 py-[7px] text-[.9rem] text-ink outline-offset-2"
            value={draft ?? (custom ? String(value) : '')}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              if (draft !== null) commit(e.currentTarget.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e.currentTarget.value)
            }}
          />
        </span>
        {custom && (
          <button
            type="button"
            id={`${id}-reset`}
            className="cursor-pointer border-0 bg-transparent p-0 text-[.8rem] text-accent underline"
            onClick={() => {
              setBudget(field, null)
              setDraft(null)
            }}
          >
            Usar el sugerido ({formatUsd(suggested)})
          </button>
        )}
      </div>
      <span className="text-[.75rem] text-muted">
        {invalid ? 'Escribe un número mayor que 0.' : hint}
      </span>
    </div>
  )
}

function Summary({ report }: { report: BudgetReport }) {
  const { total, spent, pending, projectedRemaining, usedRatio } = report
  const pct = Math.min(100, Math.round(usedRatio * 100))
  const pendingPct = Math.min(100 - pct, Math.round((pending / Math.max(1, total)) * 100))
  const over = projectedRemaining < 0
  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        <Stat
          id="bud-total-v"
          label="Presupuesto total"
          value={formatUsd(total)}
          note={report.totalIsCustom ? 'definido por ti' : 'sugerido'}
        />
        <Stat
          id="bud-spent-v"
          label="Gastado (real)"
          value={formatUsd(spent)}
          note={`${pct}% del total`}
        />
        <Stat
          id="bud-pending-v"
          label="Por pagar (est.)"
          value={formatUsd(pending)}
          note="reservas sin importe"
        />
        <Stat
          id="bud-left-v"
          label={over ? 'Te pasas por' : 'Te queda'}
          value={formatUsd(Math.abs(projectedRemaining))}
          note="contando lo por pagar"
          warn={over}
        />
        <Stat
          id="bud-avg-v"
          label="Promedio diario"
          value={formatUsd(report.averageDaily)}
          note={
            report.daysWithExpenses
              ? `${report.daysWithExpenses} días con gastos · tope ${formatUsd(report.dailyCap)}`
              : `tope ${formatUsd(report.dailyCap)}`
          }
          warn={report.averageDaily > report.dailyCap}
        />
      </div>
      <div
        className="flex h-2 overflow-hidden rounded bg-line"
        role="progressbar"
        aria-label="Presupuesto usado"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <i
          id="bud-bar"
          className={`block h-full ${over ? 'bg-todo' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
        <i
          className="mr-0 ml-0.5 block h-full"
          style={{
            width: `${pendingPct}%`,
            background: 'color-mix(in srgb, var(--accent) 38%, var(--surface))',
          }}
        />
      </div>
    </div>
  )
}

function CategoryTable({ report }: { report: BudgetReport }) {
  const sum = (pick: (r: BudgetReport['rows'][number]) => number) =>
    report.rows.reduce((acc, r) => acc + pick(r), 0)
  return (
    <div className="overflow-x-auto rounded-md border border-line bg-surface">
      <table className={ui.table} id="bud-table">
        <thead>
          <tr>
            <th>Categoría</th>
            <th className="text-right!">Presupuestado</th>
            <th className="text-right!">Real</th>
            <th className="text-right!">Por pagar</th>
            <th className="text-right!">Diferencia</th>
          </tr>
        </thead>
        <tbody>
          {report.rows.map((r) => (
            <tr key={r.category} data-testid="bud-row" data-cat={r.category}>
              <td>{r.label}</td>
              <td className="text-right font-mono">{formatUsd(r.budget)}</td>
              <td className="text-right font-mono">{formatUsd(r.real)}</td>
              <td className="text-right font-mono text-muted">
                {r.pending > 0 ? formatUsd(r.pending) : '—'}
              </td>
              <td
                className={`text-right font-mono font-semibold ${r.difference < 0 ? 'text-todo' : 'text-paid'}`}
              >
                {signed(r.difference)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr data-testid="bud-total-row" className="font-semibold">
            <td>Total</td>
            <td className="text-right font-mono">{formatUsd(sum((r) => r.budget))}</td>
            <td className="text-right font-mono">{formatUsd(report.spent)}</td>
            <td className="text-right font-mono">{formatUsd(report.pending)}</td>
            <td
              className={`text-right font-mono ${report.projectedRemaining < 0 ? 'text-todo' : 'text-paid'}`}
            >
              {signed(report.projectedRemaining)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

export function BudgetView() {
  const { trip, rate } = useApp()
  const booking = useAppStore((s) => s.booking)
  const report = computeBudget(trip, booking, rate)
  const days = report.overDays

  return (
    <section className={ui.panel} id="p-bud" role="tabpanel" aria-labelledby="tab-bud">
      <p className={ui.lead}>
        Tu presupuesto contra lo que realmente pagas. Al anotar «Pagué» en una reserva, ese importe
        reemplaza al estimado; los gastos del día a día se registran abajo. Todo en dólares.
      </p>

      <Summary report={report} />

      <div className={`${ui.card} grid gap-x-8 gap-y-3 p-3.5 sm:grid-cols-2`}>
        <SettingField
          id="bud-total"
          label="Presupuesto total"
          field="total"
          value={report.total}
          suggested={report.suggestedTotal}
          custom={report.totalIsCustom}
          hint={`Sugerido: las reservas del plan más ${formatUsd(DAILY_ALLOWANCE)} por día (${report.tripDays} días).`}
        />
        <SettingField
          id="bud-cap"
          label="Tope de gasto diario"
          field="dailyCap"
          value={report.dailyCap}
          suggested={report.suggestedDailyCap}
          custom={report.dailyCapIsCustom}
          hint="Sugerido: lo presupuestado para comida, transporte local, souvenirs e imprevistos entre los días."
        />
      </div>

      {days.length > 0 && (
        <p className={ui.warn} role="status" id="bud-alert">
          <b>Pasaste el tope diario {days.length === 1 ? 'un día' : `${days.length} días`}: </b>
          {days
            .map((d) => `${weekdayShort(d.day)} ${d.day} nov (${formatUsd(d.spent)})`)
            .join(', ')}
          .
        </p>
      )}

      <div className="grid gap-3 lg:grid-cols-2">
        <CategoryChart report={report} />
        <DailyChart report={report} />
      </div>

      <h2 className={ui.subH}>Por categoría</h2>
      <CategoryTable report={report} />
      <p className={ui.note}>
        Diferencia = presupuestado − real − por pagar: en verde te sobra, en naranja te falta.
        Hospedaje y traslados parten del estimado del plan; el resto del total se reparte entre
        entradas (20 %), comida (40 %), transporte local (15 %), souvenirs (10 %) e imprevistos (lo
        que reste).
      </p>

      <ExpenseLog report={report} />
    </section>
  )
}
