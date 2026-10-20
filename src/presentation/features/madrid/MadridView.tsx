import { airbnbSearchUrl, bookingSearchUrl } from '../../../domain/links'
import { formatRange } from '../../../domain/money'
import { budgetTotal } from '../../../domain/summary'
import { useApp } from '../../AppContext'
import { ExtLink } from '../../components/Links'
import { ui } from '../../ui'
import { DayCard } from '../calendar/CalendarView'

export function MadridView() {
  const { trip } = useApp()
  const guide = trip.guides.madrid
  const apartment = trip.stays.find((s) => s.kind === 'apartment')
  const days = apartment
    ? trip.days.filter((d) => d.day >= apartment.checkIn && d.day <= apartment.checkOut)
    : []
  const total = budgetTotal(trip.madridBudget)

  return (
    <section className={ui.panel} id="p-mad" role="tabpanel" aria-labelledby="tab-mad">
      <p className={ui.lead}>{guide.lead}</p>
      <p className={ui.warn}>
        <b>Cambio de ruta.</b> {guide.routeNote}
      </p>

      <h2 className={ui.subH}>Plan del 21 al 26 de noviembre</h2>
      <ol className={ui.list}>
        {days.map((d) => (
          <DayCard key={d.day} day={d} scope="mad" />
        ))}
      </ol>

      <h2 className={ui.subH}>Tour Bernabéu: el miércoles 25</h2>
      <div className={ui.row + ' grid-cols-1!'}>
        <div>
          <p className={`${ui.note} mt-0`}>{guide.bernabeuIntro}</p>
          <div className="overflow-x-auto">
            <table className={ui.table}>
              <thead>
                <tr>
                  <th>Entrada (en línea)</th>
                  <th>Precio desde</th>
                </tr>
              </thead>
              <tbody>
                {trip.bernabeuPrices.map((p) => (
                  <tr key={p.concept}>
                    <td>{p.concept}</td>
                    <td>{formatRange(p.price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className={`${ui.tips} mt-2.5`}>
            {guide.bernabeuTips.map((tip) => (
              <li key={tip.title}>
                <b>{tip.title}</b> {tip.text}
              </li>
            ))}
          </ul>
          <div className={ui.links}>
            <ExtLink href={guide.bernabeuBuyUrl}>Comprar en realmadrid.com</ExtLink>
          </div>
        </div>
      </div>

      <h2 className={ui.subH}>Dónde dormir: apartamento privado</h2>
      <p className={ui.lead}>{guide.zonesLead}</p>
      <ul className={ui.list}>
        {guide.zones.map((z) => (
          <li key={z.id} className={`${ui.row} grid-cols-1!`}>
            <div>
              <h3 className={ui.rowTitle}>{z.name}</h3>
              <div className={ui.meta}>{z.places}</div>
              <p className={ui.note}>{z.description}</p>
              {z.priceNote && (
                <p className={ui.note}>
                  <b>Precio.</b> {z.priceNote}
                </p>
              )}
              {apartment && (
                <div className={ui.links}>
                  <ExtLink href={bookingSearchUrl(apartment, z.bookingTerm)}>
                    Booking {z.airbnbTerm}
                  </ExtLink>
                  <ExtLink href={airbnbSearchUrl(apartment, z.airbnbTerm)}>
                    Airbnb {z.airbnbTerm}
                  </ExtLink>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className={ui.note}>{guide.zonesAvoid}</p>
      <h3 className={`${ui.subH} text-base!`}>Antes de reservar</h3>
      <ul className={ui.tips}>
        {guide.beforeBooking.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2 className={ui.subH}>Cuánto cuesta, para dos</h2>
      <div className="overflow-x-auto">
        <table className={ui.table}>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Estimado</th>
            </tr>
          </thead>
          <tbody>
            {trip.madridBudget.map((l) => (
              <tr key={l.concept}>
                <td>{l.concept}</td>
                <td>{formatRange(l.price)}</td>
              </tr>
            ))}
            <tr className="font-bold [&>td]:border-b-0">
              <td>Total sin comida ni vuelos</td>
              <td>{formatRange(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className={ui.note}>{guide.budgetNote}</p>
      <p className={ui.note}>
        Fuentes:{' '}
        {guide.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && ', '}
            <ExtLink href={s.url}>{s.label}</ExtLink>
          </span>
        ))}
        .
      </p>
    </section>
  )
}
