import { formatRange, formatRate, scaleRange } from '../../../domain/money'
import { airbnbSearchUrl, bookingSearchUrl } from '../../../domain/links'
import { nightsOf, stayTotal, summarizeLodging } from '../../../domain/summary'
import type { Stay } from '../../../domain/trip'
import { useApp } from '../../AppContext'
import { PasteBox, StatusButton } from '../../components/BookingControls'
import { CityButton } from '../../components/CityButton'
import { ExtLink } from '../../components/Links'
import { COUNTRY_COLOR } from '../../theme'

function HostelRow({ stay }: { stay: Stay }) {
  const n = nightsOf(stay)
  return (
    <li className="row" style={{ borderLeft: `5px solid ${COUNTRY_COLOR[stay.country]}` }}>
      <div>
        <h3>{stay.name}</h3>
        <div className="meta">
          {stay.checkIn} a {stay.checkOut} nov · {n} {n === 1 ? 'noche' : 'noches'}
        </div>
        <p className="price">
          <b>Dormitorio compartido: {formatRange(stay.nightly)} por noche</b> · {stay.priceNote} ·
          total de tu estancia en cama de dormitorio {formatRange(stayTotal(stay))}
        </p>
        <div className="links">
          <ExtLink href={bookingSearchUrl(stay)}>Buscar en Booking con mis fechas</ExtLink>
          <ExtLink href={stay.altUrl}>{stay.altLabel}</ExtLink>
          <CityButton cityId={stay.cityId}>Ver lugares</CityButton>
        </div>
        <PasteBox itemKey={stay.id} />
      </div>
      <StatusButton itemKey={stay.id} />
    </li>
  )
}

function ApartmentRow({ stay }: { stay: Stay }) {
  const { trip } = useApp()
  const n = nightsOf(stay)
  const zones = trip.guides.madrid.zones
  return (
    <li className="row" style={{ borderLeft: `5px solid ${COUNTRY_COLOR[stay.country]}` }}>
      <div>
        <h3>Madrid: apartamento privado</h3>
        <div className="meta">
          {stay.checkIn} a {stay.checkOut} nov · {n} noches · {stay.guests} personas
        </div>
        <p className="note">
          Desde el 21 dormís en un apartamento entero. Zona recomendada: Chamberí. Compara zonas en
          la pestaña Madrid 21–26.
        </p>
        <p className="price">
          <b>Estimado: {formatRange(stay.nightly)} por noche</b> · {n} noches{' '}
          {formatRange(scaleRange(stay.nightly, n))}, más limpieza de{' '}
          {stay.fees ? formatRange(stay.fees) : '—'} · para dos
        </p>
        <div className="links">
          {zones.map((z) => (
            <ExtLink key={`b-${z.id}`} href={bookingSearchUrl(stay, z.bookingTerm)}>
              Booking {z.airbnbTerm}
            </ExtLink>
          ))}
          <ExtLink href={airbnbSearchUrl(stay, zones[0]?.airbnbTerm ?? 'Madrid')}>
            Airbnb Chamberí
          </ExtLink>
          <CityButton cityId="madrid">Ver lugares</CityButton>
        </div>
        <PasteBox itemKey={stay.id} />
      </div>
      <StatusButton itemKey={stay.id} />
    </li>
  )
}

export function LodgingView() {
  const { trip, rate } = useApp()
  const summary = summarizeLodging(trip.stays)
  return (
    <section className="panel" id="p-hos" role="tabpanel" aria-labelledby="tab-hos">
      <p className="lead">
        Cada enlace de Booking abre hostels con tus fechas ya puestas. Elige tarifa con cancelación
        gratuita hasta tener vuelos y trenes confirmados. Hostelworld y Hostelz no cargan las
        fechas: ponlas al entrar. En Madrid, desde el 21 de nov, el alojamiento es un apartamento
        privado.
      </p>
      <div className="sum">
        <span>
          <b>{formatRange(summary.hostelTotal)}</b> por tus {summary.hostelNights} noches en hostel,
          en cama de dormitorio (una persona)
        </span>
        {summary.apartment && (
          <div>
            <b>{formatRange(stayTotal(summary.apartment))}</b> por el apartamento de Madrid,{' '}
            {nightsOf(summary.apartment)} noches, para dos (alojamiento más limpieza)
          </div>
        )}
        <small>
          Precios estimados de guías y buscadores el 19 de oct de 2026, en dólares al cambio de{' '}
          {formatRate(rate)}. No son disponibilidad ni precio final: míralo con tus fechas.
        </small>
      </div>
      <ul className="rows">
        {trip.stays.map((s) =>
          s.kind === 'apartment' ? (
            <ApartmentRow key={s.id} stay={s} />
          ) : (
            <HostelRow key={s.id} stay={s} />
          ),
        )}
      </ul>
      <p className="warn">
        Si Booking no muestra resultados con el filtro de hostels, quita el filtro y busca
        &quot;hostal&quot; o &quot;pensión&quot;. En Vigo hay pocos hostels de verdad.
      </p>
    </section>
  )
}
