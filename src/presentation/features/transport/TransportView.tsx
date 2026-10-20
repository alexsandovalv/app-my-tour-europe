import { formatRange, formatRate } from '../../../domain/money'
import { summarizeTransport } from '../../../domain/summary'
import { weekdayShort } from '../../../domain/calendar'
import { useApp } from '../../AppContext'
import { PasteBox, StatusButton } from '../../components/BookingControls'
import { LinkList } from '../../components/Links'

export function TransportView() {
  const { trip, rate } = useApp()
  const summary = summarizeTransport(trip.transfers)
  return (
    <section className="panel" id="p-tra" role="tabpanel" aria-labelledby="tab-tra">
      <p className="lead">
        Compara en Skyscanner u Omio y compra en la web oficial. Los trenes de Renfe y Trenitalia
        abren venta con 2 a 4 meses de antelación. Los vuelos de bajo costo cobran la maleta de
        bodega aparte.
      </p>
      <div className="sum">
        <span>
          <b>{formatRange(summary.legsTotal)}</b> por persona por los {summary.legs} tramos entre
          ciudades
        </span>
        {summary.excursions.map((t) => (
          <div key={t.id}>
            <b>{formatRange(t.price)}</b> por persona por la excursión: {t.title.toLowerCase()}
          </div>
        ))}
        <small>
          Tarifas más baratas encontradas y promedios de buscadores el 19 de oct de 2026, en dólares
          al cambio de {formatRate(rate)}. Los vuelos suben cerca de la fecha, así que compra
          pronto.
        </small>
      </div>
      <ul className="rows">
        {trip.transfers.map((t) => (
          <li key={t.id} className="row">
            <div>
              <h3>{t.title}</h3>
              <div className="meta">{t.dateLabel}</div>
              <p className="note">{t.description}</p>
              <p className="price">
                <b>
                  Estimado: {formatRange(t.price)} por persona
                  {t.excursion ? ', ida y vuelta' : ', por tramo'}
                </b>{' '}
                · {t.priceNote}
              </p>
              <div className="links">
                <span className="meta">Comparar</span>
                <LinkList links={t.compare} />
                <span className="meta">Comprar</span>
                <LinkList links={t.buy} />
              </div>
              <PasteBox itemKey={t.id} />
            </div>
            <StatusButton itemKey={t.id} />
          </li>
        ))}
      </ul>
      <h2 className="sub-h">Vuelo internacional</h2>
      <p className="lead">
        Lima a Madrid el 2 de nov y Madrid, São Paulo, Lima el 26 y 27 de nov ya están definidos.
        Confirma en la web de tu aerolínea el check-in y que la maleta llegue hasta Lima.
      </p>
      <ul className="flights" aria-label="Vuelos de la reserva compartida">
        {trip.sharedFlights.map((f) => (
          <li key={f.code}>
            <b>{f.code}</b> {f.route}: {f.kind === 'arrival' ? 'aterriza' : 'sale'} el{' '}
            {weekdayShort(f.day)} {f.day} de nov a las {f.time} (reserva compartida)
          </li>
        ))}
      </ul>
      <p className="warn">{trip.guides.transportWarn}</p>
    </section>
  )
}
