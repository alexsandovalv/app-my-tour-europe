import { isDone } from '../../../domain/booking'
import type { Ticket } from '../../../domain/trip'
import { useApp, useAppStore } from '../../AppContext'
import {
  DoneBox,
  PasteBox,
  RealFields,
  RowActions,
  useDone,
} from '../../components/BookingControls'
import { ExtLink } from '../../components/Links'
import { ui } from '../../ui'

const checklistKey = (index: number): string => `chk-${index}`

function TicketRow({ ticket: t }: { ticket: Ticket }) {
  const done = useDone(t.id)
  return (
    <li data-testid="row" data-done={done} className={`${ui.row}${done ? ' opacity-70' : ''}`}>
      <div>
        <h3 className={`${ui.rowTitle}${done ? ' line-through decoration-muted' : ''}`}>
          {t.title}
        </h3>
        <div className={ui.meta}>
          {t.dateLabel} · {t.cityLabel}
        </div>
        <p className={ui.note}>{t.note}</p>
        <div className={ui.links}>
          <ExtLink href={t.url}>{t.urlLabel}</ExtLink>
          {t.extraLink && <ExtLink href={t.extraLink.url}>{t.extraLink.label}</ExtLink>}
        </div>
        <PasteBox itemKey={t.id} />
        <RealFields itemKey={t.id} />
      </div>
      <RowActions itemKey={t.id} doneLabel={`Entrada: ${t.title}`} />
    </li>
  )
}

export function TicketsView() {
  const { trip } = useApp()
  const used = useAppStore((s) => trip.tickets.filter((t) => isDone(s.booking, t.id)).length)
  const checked = useAppStore(
    (s) => trip.guides.travelChecklist.filter((_, i) => isDone(s.booking, checklistKey(i))).length,
  )
  const items = trip.guides.travelChecklist
  return (
    <section className={ui.panel} id="p-ent" role="tabpanel" aria-labelledby="tab-ent">
      <p className={ui.lead}>
        Compra solo en la web oficial de cada atracción: los sitios de nombre parecido que revenden
        entradas cobran de más. Roma, Florencia y Barcelona se agotan primero. Marca «Hecho» cuando
        uses cada entrada.
      </p>
      <p className={ui.meta} id="ticketsProgress">
        Entradas usadas: {used} de {trip.tickets.length}
      </p>
      <ul className={ui.list}>
        {trip.tickets.map((t) => (
          <TicketRow key={t.id} ticket={t} />
        ))}
      </ul>
      <h2 className={ui.subH}>Antes de salir de Lima</h2>
      <p className={ui.meta} id="checklistProgress">
        Lista cumplida: {checked} de {items.length}
      </p>
      <ul
        className="m-0 flex list-none flex-col gap-2 p-0"
        aria-label="Lista antes de salir de Lima"
      >
        {items.map((item, i) => (
          <ChecklistRow key={item.text} index={i} item={item} />
        ))}
      </ul>
    </section>
  )
}

function ChecklistRow({
  index,
  item,
}: {
  index: number
  item: { text: string; links?: readonly { label: string; url: string }[] }
}) {
  const key = checklistKey(index)
  const done = useDone(key)
  return (
    <li
      data-testid="check-item"
      data-done={done}
      className="grid max-w-[66ch] grid-cols-[auto_minmax(0,1fr)] items-start gap-2.5"
    >
      <span className="pt-0.5">
        <DoneBox itemKey={key} label={`Cumplido: ${item.text}`} />
      </span>
      <span className={done ? 'text-muted line-through' : ''}>
        {item.text}
        {item.links && (
          <>
            {' '}
            {item.links.map((l, i) => (
              <span key={l.url}>
                {i > 0 && ' · '}
                <ExtLink href={l.url}>{l.label}</ExtLink>
              </span>
            ))}
          </>
        )}
      </span>
    </li>
  )
}
