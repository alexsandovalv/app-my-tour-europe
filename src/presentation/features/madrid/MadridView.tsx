import { airbnbSearchUrl, bookingSearchUrl } from '../../../domain/links'
import { formatRange } from '../../../domain/money'
import { budgetTotal } from '../../../domain/summary'
import { useApp } from '../../AppContext'
import { ExtLink } from '../../components/Links'
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
    <section className="panel" id="p-mad" role="tabpanel" aria-labelledby="tab-mad">
      <p className="lead">{guide.lead}</p>
      <p className="warn">
        <b>Cambio de ruta.</b> {guide.routeNote}
      </p>

      <h2 className="sub-h">Plan del 21 al 26 de noviembre</h2>
      <ol className="days">
        {days.map((d) => (
          <DayCard key={d.day} day={d} />
        ))}
      </ol>

      <h2 className="sub-h">Tour Bernabéu: el miércoles 25</h2>
      <div className="row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
        <div>
          <p className="note" style={{ marginTop: 0 }}>
            {guide.bernabeuIntro}
          </p>
          <div className="tbl">
            <table>
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
          <ul className="tips" style={{ marginTop: 10 }}>
            {guide.bernabeuTips.map((tip) => (
              <li key={tip.title}>
                <b>{tip.title}</b> {tip.text}
              </li>
            ))}
          </ul>
          <div className="links">
            <ExtLink href={guide.bernabeuBuyUrl}>Comprar en realmadrid.com</ExtLink>
          </div>
        </div>
      </div>

      <h2 className="sub-h">Dónde dormir: apartamento privado</h2>
      <p className="lead">{guide.zonesLead}</p>
      <ul className="rows">
        {guide.zones.map((z) => (
          <li key={z.id} className="row" style={{ gridTemplateColumns: 'minmax(0,1fr)' }}>
            <div>
              <h3>{z.name}</h3>
              <div className="meta">{z.places}</div>
              <p className="note">{z.description}</p>
              {z.priceNote && (
                <p className="note">
                  <b>Precio.</b> {z.priceNote}
                </p>
              )}
              {apartment && (
                <div className="links">
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
      <p className="note">{guide.zonesAvoid}</p>
      <h3 className="sub-h" style={{ fontSize: '1rem' }}>
        Antes de reservar
      </h3>
      <ul className="tips">
        {guide.beforeBooking.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>

      <h2 className="sub-h">Cuánto cuesta, para dos</h2>
      <div className="tbl">
        <table>
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
            <tr className="tot">
              <td>Total sin comida ni vuelos</td>
              <td>{formatRange(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="note">{guide.budgetNote}</p>
      <p className="note">
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
