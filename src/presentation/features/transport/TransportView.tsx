import { weekdayShort } from '../../../domain/calendar'
import { formatRange, formatRate } from '../../../domain/money'
import { summarizeTransport } from '../../../domain/summary'
import { MODE_LABEL, modeOf } from '../../../domain/transport'
import type { Transfer } from '../../../domain/trip'
import { useApp, useAppStore } from '../../AppContext'
import { PasteBox, RealFields, StatusButton } from '../../components/BookingControls'
import { LinkList } from '../../components/Links'
import { ModePicker } from '../../components/ModePicker'
import { ModeIcon } from '../../components/UiIcons'
import { CITY_COLOR, cssVars } from '../../theme'
import { ui } from '../../ui'

function TransferRow({ transfer }: { transfer: Transfer }) {
  const mode = useAppStore((s) => modeOf(s.booking, transfer))
  return (
    <li
      data-testid="row"
      data-transfer={transfer.id}
      className={`${ui.row} border-l-[5px] border-l-[color:var(--cc)]`}
      style={cssVars({ '--cc': CITY_COLOR[transfer.to] })}
    >
      <div>
        <h3 className={`${ui.rowTitle} flex flex-wrap items-center gap-2`}>
          {transfer.title}
          <span
            data-testid="mode-badge"
            className="inline-flex items-center gap-1 rounded-full bg-soft px-2 py-0.5 font-sans text-[.72rem] font-semibold text-accent"
          >
            <ModeIcon mode={mode} className="size-3.5" />
            {MODE_LABEL[mode]}
          </span>
        </h3>
        <div className={ui.meta}>{transfer.dateLabel}</div>
        <p className={ui.note}>{transfer.description}</p>
        <p className={ui.price}>
          <b>
            Estimado: {formatRange(transfer.price)} por persona
            {transfer.excursion ? ', ida y vuelta' : ', por tramo'}
          </b>{' '}
          · {transfer.priceNote}
        </p>
        <div className={ui.links}>
          <span className="font-mono text-[.72rem] font-normal text-muted">Comparar</span>
          <LinkList links={transfer.compare} />
          <span className="font-mono text-[.72rem] font-normal text-muted">Comprar</span>
          <LinkList links={transfer.buy} />
        </div>
        <ModePicker transfer={transfer} />
        <PasteBox itemKey={transfer.id} />
        <RealFields itemKey={transfer.id} />
      </div>
      <StatusButton itemKey={transfer.id} />
    </li>
  )
}

export function TransportView() {
  const { trip, rate } = useApp()
  const summary = summarizeTransport(trip.transfers)
  return (
    <section className={ui.panel} id="p-tra" role="tabpanel" aria-labelledby="tab-tra">
      <p className={ui.lead}>
        Compara en Skyscanner u Omio y compra en la web oficial. Los trenes de Renfe y Trenitalia
        abren venta con 2 a 4 meses de antelación. Los vuelos de bajo costo cobran la maleta de
        bodega aparte. En cada tramo puedes registrar si fuiste en avión, tren o bus: el mapa y la
        agenda se actualizan.
      </p>
      <div className={ui.sum}>
        <span>
          <b>{formatRange(summary.legsTotal)}</b> por persona por los {summary.legs} tramos entre
          ciudades
        </span>
        {summary.excursions.map((t) => (
          <div key={t.id}>
            <b>{formatRange(t.price)}</b> por persona por la excursión: {t.title}
          </div>
        ))}
        <small>
          Tarifas más baratas encontradas y promedios de buscadores el 19 de oct de 2026, en dólares
          al cambio de {formatRate(rate)}. Los vuelos suben cerca de la fecha, así que compra
          pronto.
        </small>
      </div>
      <ul className={ui.list}>
        {trip.transfers.map((t) => (
          <TransferRow key={t.id} transfer={t} />
        ))}
      </ul>
      <h2 className={ui.subH}>Vuelo internacional</h2>
      <p className={ui.lead}>
        Lima a Madrid el 2 de nov y Madrid, São Paulo, Lima el 26 y 27 de nov ya están definidos.
        Confirma en la web de tu aerolínea el check-in y que la maleta llegue hasta Lima.
      </p>
      <ul
        className="m-0 flex list-none flex-col gap-1 p-0 text-[.9rem]"
        aria-label="Vuelos de la reserva compartida"
      >
        {trip.sharedFlights.map((f) => (
          <li key={f.code}>
            <b className="font-mono font-semibold">{f.code}</b> {f.route}:{' '}
            {f.kind === 'arrival' ? 'aterriza' : 'sale'} el {weekdayShort(f.day)} {f.day} de nov a
            las {f.time} (reserva compartida)
          </li>
        ))}
      </ul>
      <p className={ui.warn}>{trip.guides.transportWarn}</p>
    </section>
  )
}
