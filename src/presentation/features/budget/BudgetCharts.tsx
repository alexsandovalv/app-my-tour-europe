import { useState } from 'react'
import { weekdayShort } from '../../../domain/calendar'
import type { BudgetReport } from '../../../domain/budget'
import { formatUsd } from '../../../domain/money'

/** Colores del gráfico: salen del tema, así que cambian solos con el modo día/noche y el acento. */
const BUDGET_FILL = 'color-mix(in srgb, var(--muted) 38%, var(--surface))'
const PENDING_FILL = 'color-mix(in srgb, var(--accent) 38%, var(--surface))'
const OVER_FILL = 'var(--st-todo)'
const REAL_FILL = 'var(--accent)'

/** Nombres cortos para que quepan junto a las barras. */
const SHORT: Record<string, string> = {
  transporte: 'Traslados',
  hospedaje: 'Hospedaje',
  entradas: 'Entradas y tours',
  comida: 'Comida',
  local: 'Transporte local',
  souvenirs: 'Souvenirs',
  imprevistos: 'Imprevistos',
}

const SWATCH = 'inline-block size-2.5 rounded-[3px] align-baseline'

function Legend({ items }: { items: ReadonlyArray<{ label: string; color: string }> }) {
  return (
    <ul className="m-0 flex list-none flex-wrap gap-x-3.5 gap-y-1 p-0 text-[.75rem] text-muted">
      {items.map((i) => (
        <li key={i.label} className="inline-flex items-center gap-1.5">
          <i className={SWATCH} style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  )
}

const CARD = 'flex min-w-0 flex-col gap-2 rounded-md border border-line bg-surface p-3.5'
const TITLE = 'm-0 font-display text-[.95rem] font-semibold'

/** Presupuestado, real y por pagar de cada categoría, en barras horizontales finas. */
export function CategoryChart({ report }: { report: BudgetReport }) {
  const [hover, setHover] = useState<string | null>(null)
  const rows = report.rows
  const max = Math.max(1, ...rows.map((r) => Math.max(r.budget, r.real + r.pending)))
  const LABEL_W = 112
  const BAR_W = 200
  const ROW_H = 38
  const H = rows.length * ROW_H + 6
  const x = (v: number) => (v / max) * BAR_W

  const active = rows.find((r) => r.category === hover)
  return (
    <figure className={`${CARD} m-0`} data-testid="chart-categories">
      <figcaption className={TITLE}>Presupuestado y real, por categoría</figcaption>
      <Legend
        items={[
          { label: 'Presupuestado', color: BUDGET_FILL },
          { label: 'Real', color: REAL_FILL },
          { label: 'Por pagar (estimado)', color: PENDING_FILL },
          { label: 'Pasa el presupuesto', color: OVER_FILL },
        ]}
      />
      <svg
        viewBox={`0 0 ${LABEL_W + BAR_W + 56} ${H}`}
        role="img"
        aria-label="Barras de presupuestado, real y por pagar por categoría; la tabla de abajo tiene los mismos números"
        className="w-full"
      >
        {rows.map((r, i) => {
          const y = i * ROW_H + 4
          const over = r.real + r.pending > r.budget
          return (
            <g
              key={r.category}
              data-testid="cat-bar"
              data-cat={r.category}
              data-over={over}
              tabIndex={0}
              onMouseEnter={() => setHover(r.category)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(r.category)}
              onBlur={() => setHover(null)}
            >
              <title>{`${r.label}: presupuestado ${formatUsd(r.budget)}, real ${formatUsd(r.real)}, por pagar ${formatUsd(r.pending)}`}</title>
              {/* zona de captura más grande que las barras */}
              <rect x="0" y={y - 2} width="100%" height={ROW_H - 2} fill="transparent" />
              <text x="0" y={y + 14} className="fill-ink text-[12px]">
                {SHORT[r.category] ?? r.label}
              </text>
              <rect
                x={LABEL_W}
                y={y + 3}
                width={Math.max(2, x(r.budget))}
                height="7"
                rx="3.5"
                fill={BUDGET_FILL}
              />
              <rect
                x={LABEL_W}
                y={y + 13}
                width={Math.max(r.real > 0 ? 2 : 0, x(r.real))}
                height="7"
                rx="3.5"
                fill={over ? OVER_FILL : REAL_FILL}
              />
              {r.pending > 0 && (
                <rect
                  x={LABEL_W + x(r.real) + 2}
                  y={y + 13}
                  width={Math.max(2, x(r.pending))}
                  height="7"
                  rx="3.5"
                  fill={PENDING_FILL}
                />
              )}
              <text
                x={LABEL_W + BAR_W + 6}
                y={y + 20}
                className={`font-mono text-[11px] ${over ? 'fill-todo' : 'fill-muted'}`}
              >
                {formatUsd(Math.round(r.real))}
              </text>
            </g>
          )
        })}
      </svg>
      <p className="m-0 min-h-[1.2em] text-[.78rem] text-muted" aria-live="polite">
        {active
          ? `${active.label}: presupuestado ${formatUsd(active.budget)} · real ${formatUsd(active.real)} · por pagar ${formatUsd(active.pending)}`
          : 'Pasa el cursor o enfoca una fila para ver los importes.'}
      </p>
    </figure>
  )
}

/** Gasto de cada día del viaje frente al tope diario. */
export function DailyChart({ report }: { report: BudgetReport }) {
  const [hover, setHover] = useState<number | null>(null)
  const { daily, dailyCap } = report
  const peak = Math.max(0, ...daily.map((d) => d.spent))
  const top = Math.max(dailyCap * 1.3, peak * 1.12, 10)
  const W = 372
  const PLOT_H = 120
  const PAD_L = 4
  const PAD_B = 22
  const step = (W - PAD_L) / daily.length
  const barW = Math.max(4, step - 4)
  const y = (v: number) => PLOT_H - (v / top) * PLOT_H
  const active = daily.find((d) => d.day === hover)

  return (
    <figure className={`${CARD} m-0`} data-testid="chart-daily">
      <figcaption className={TITLE}>Gasto diario y tope</figcaption>
      <Legend
        items={[
          { label: 'Gasto del día', color: REAL_FILL },
          { label: 'Pasa el tope', color: OVER_FILL },
        ]}
      />
      <svg
        viewBox={`0 0 ${W} ${PLOT_H + PAD_B}`}
        role="img"
        aria-label={`Barras del gasto de cada día de noviembre; el tope diario es ${formatUsd(dailyCap)}`}
        className="w-full"
      >
        <line x1={PAD_L} x2={W} y1={PLOT_H} y2={PLOT_H} stroke="var(--line)" strokeWidth="1" />
        {daily.map((d, i) => {
          const bx = PAD_L + i * step + (step - barW) / 2
          const h = d.spent > 0 ? Math.max(3, PLOT_H - y(d.spent)) : 0
          return (
            <g
              key={d.day}
              data-testid="day-bar"
              data-day={d.day}
              data-over={d.over}
              tabIndex={0}
              onMouseEnter={() => setHover(d.day)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(d.day)}
              onBlur={() => setHover(null)}
            >
              <title>{`${weekdayShort(d.day)} ${d.day} nov: ${formatUsd(d.spent)} de ${formatUsd(dailyCap)}`}</title>
              <rect x={bx - 2} y="0" width={barW + 4} height={PLOT_H} fill="transparent" />
              {h > 0 && (
                <rect
                  x={bx}
                  y={PLOT_H - h}
                  width={barW}
                  height={h}
                  rx="2"
                  fill={d.over ? OVER_FILL : REAL_FILL}
                />
              )}
              {(d.day % 3 === 0 || d.day === daily[0]?.day) && (
                <text
                  x={bx + barW / 2}
                  y={PLOT_H + 14}
                  textAnchor="middle"
                  className="fill-muted font-mono text-[10px]"
                >
                  {d.day}
                </text>
              )}
            </g>
          )
        })}
        <line
          data-testid="cap-line"
          x1={PAD_L}
          x2={W}
          y1={y(dailyCap)}
          y2={y(dailyCap)}
          stroke="var(--ink)"
          strokeWidth="1.2"
          strokeDasharray="4 3"
        />
        <text
          x={W}
          y={Math.max(9, y(dailyCap) - 3)}
          textAnchor="end"
          className="fill-ink font-mono text-[10px]"
        >
          {`Tope ${formatUsd(dailyCap)}`}
        </text>
      </svg>
      <p className="m-0 min-h-[1.2em] text-[.78rem] text-muted" aria-live="polite">
        {active
          ? `${weekdayShort(active.day)} ${active.day} nov: ${formatUsd(active.spent)} de ${formatUsd(dailyCap)}${active.over ? ' · te pasaste del tope' : ''}`
          : 'Noviembre, del 3 al 27. Pasa el cursor sobre un día para ver el gasto.'}
      </p>
    </figure>
  )
}
