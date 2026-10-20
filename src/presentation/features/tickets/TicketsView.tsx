import { useApp } from '../../AppContext'
import { PasteBox, RealFields, StatusButton } from '../../components/BookingControls'
import { ExtLink } from '../../components/Links'
import { ui } from '../../ui'

export function TicketsView() {
  const { trip } = useApp()
  return (
    <section className={ui.panel} id="p-ent" role="tabpanel" aria-labelledby="tab-ent">
      <p className={ui.lead}>
        Compra solo en la web oficial de cada atracción: los sitios de nombre parecido que revenden
        entradas cobran de más. Roma, Florencia y Barcelona se agotan primero.
      </p>
      <ul className={ui.list}>
        {trip.tickets.map((t) => (
          <li key={t.id} data-testid="row" className={ui.row}>
            <div>
              <h3 className={ui.rowTitle}>{t.title}</h3>
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
            <StatusButton itemKey={t.id} />
          </li>
        ))}
      </ul>
      <h2 className={ui.subH}>Antes de salir de Lima</h2>
      <ul className={ui.tips}>
        {trip.guides.travelChecklist.map((item) => (
          <li key={item.text}>
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
          </li>
        ))}
      </ul>
    </section>
  )
}
