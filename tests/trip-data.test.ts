import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { cityLabelForDay, eventsOfDay } from '../src/domain/agenda'
import { novemberGrid } from '../src/domain/calendar'
import { airbnbSearchUrl, bookingSearchUrl } from '../src/domain/links'
import { budgetTotal, nightsOf, summarizeLodging, summarizeTransport } from '../src/domain/summary'
import { loadTrip } from '../src/application/loadTrip'
import { EMPTY_BOOKING_STATE, setTransportMode, type BookingState } from '../src/domain/booking'
import { modeOf } from '../src/domain/transport'
import { TRIP, staticTripSource } from '../src/infrastructure/data/tripData'
import { staticRateProvider } from '../src/infrastructure/fx/ecbRate'

const usdTrip = loadTrip(staticTripSource, staticRateProvider)

describe('integridad de los datos', () => {
  it('los días del itinerario son consecutivos del 3 al 27', () => {
    const days = TRIP.days.map((d) => d.day)
    assert.deepEqual(
      days,
      Array.from({ length: 25 }, (_, i) => i + 3),
    )
  })

  it('las estancias cubren del 3 al 26 sin huecos ni solapes', () => {
    const stays = [...TRIP.stays].sort((a, b) => a.checkIn - b.checkIn)
    assert.equal(stays[0]?.checkIn, 3)
    assert.equal(stays.at(-1)?.checkOut, 26)
    stays.slice(1).forEach((s, i) => assert.equal(s.checkIn, stays[i]?.checkOut, s.id))
  })

  it('Vigo tiene 3 noches y Santiago es excursión, sin estancia', () => {
    const vigo = TRIP.stays.find((s) => s.cityId === 'vigo')
    assert.equal(vigo && nightsOf(vigo), 3)
    assert.equal(
      TRIP.stays.some((s) => s.cityId === 'santiago'),
      false,
    )
    assert.equal(TRIP.days.find((d) => d.day === 7)?.kind, 'excursion')
  })

  it('los identificadores son únicos y las ciudades referenciadas existen', () => {
    const ids = [...TRIP.stays, ...TRIP.transfers, ...TRIP.tickets].map((x) => x.id)
    assert.equal(new Set(ids).size, ids.length)
    for (const d of TRIP.days) assert.ok(TRIP.cities[d.cityId], `día ${d.day}`)
    for (const s of TRIP.stays) assert.ok(TRIP.cities[s.cityId], s.id)
  })

  it('todos los eventos de la agenda caen entre el 2 y el 27', () => {
    for (const e of TRIP.agenda) assert.ok(e.day >= 2 && e.day <= 27, e.title)
  })

  it('el plan no menciona a la pareja', () => {
    assert.equal(/enamorad/i.test(JSON.stringify(usdTrip)), false)
  })

  it('los vuelos compartidos coinciden con los días 21 y 26', () => {
    assert.deepEqual(
      TRIP.sharedFlights.map((f) => [f.code, f.day, f.time]),
      [
        ['PU302', 21, '12:45'],
        ['PU301', 26, '11:00'],
      ],
    )
  })
})

describe('precios en dólares', () => {
  it('no queda ningún importe en euros en lo que ve el usuario', () => {
    assert.equal(JSON.stringify(usdTrip).includes('€'), false)
  })

  it('todos los rangos quedan en USD', () => {
    const ranges = [
      ...usdTrip.stays.map((s) => s.nightly),
      ...usdTrip.transfers.map((t) => t.price),
      ...usdTrip.madridBudget.map((b) => b.price),
    ]
    for (const r of ranges) assert.equal(r.currency, 'USD')
  })

  it('el presupuesto de Madrid suma las líneas ya convertidas', () => {
    const total = budgetTotal(usdTrip.madridBudget)
    const lines = usdTrip.madridBudget.map((l) => l.price)
    assert.equal(
      total.low,
      lines.reduce((a, r) => a + r.low, 0),
    )
    assert.equal(total.currency, 'USD')
    // 543 a 936 euros -> unos 609 a 1.051 dólares (cada línea se redondea por separado)
    assert.ok(Math.abs(total.low - 543 * 1.1225) < 3)
    assert.ok(Math.abs(total.high - 936 * 1.1225) < 3)
  })

  it('resume hostels y transporte', () => {
    const lodging = summarizeLodging(TRIP.stays)
    assert.equal(lodging.hostelNights, 18)
    assert.equal(lodging.apartment?.id, 'h-mad2')
    const transport = summarizeTransport(TRIP.transfers)
    assert.equal(transport.legs, 7)
    assert.deepEqual(
      transport.excursions.map((t) => t.id),
      ['t-2', 't-9'],
    )
  })
})

describe('calendario y agenda de noviembre', () => {
  it('la cuadrícula solo tiene días de noviembre y huecos vacíos', () => {
    const grid = novemberGrid()
    assert.equal(grid.length % 7, 0)
    assert.deepEqual(
      grid.filter((c) => c !== null),
      Array.from({ length: 30 }, (_, i) => i + 1),
    )
    assert.equal(grid.indexOf(1), 6) // el 1 de noviembre de 2026 es domingo
  })

  it('cada día de noviembre tiene una etiqueta de ciudad', () => {
    for (let d = 1; d <= 30; d++) assert.ok(cityLabelForDay(TRIP, d).label.length > 0, `día ${d}`)
  })

  it('etiquetas clave', () => {
    assert.equal(cityLabelForDay(TRIP, 1).label, 'Lima')
    assert.equal(cityLabelForDay(TRIP, 2).label, 'Lima → Madrid')
    assert.equal(cityLabelForDay(TRIP, 6).label, 'Madrid → Vigo')
    assert.equal(cityLabelForDay(TRIP, 7).label, 'Santiago')
    assert.equal(cityLabelForDay(TRIP, 7).kind, 'excursion')
    assert.equal(cityLabelForDay(TRIP, 21).label, 'París → Madrid')
    assert.equal(cityLabelForDay(TRIP, 27).label, 'São Paulo → Lima')
    assert.equal(cityLabelForDay(TRIP, 28).label, 'Lima')
  })

  it('los eventos de un día salen en orden cronológico', () => {
    const times = eventsOfDay(TRIP, 23).map((e) => e.time ?? '')
    assert.deepEqual(times, [...times].sort())
  })
})

describe('enlaces de reserva', () => {
  const vigo = TRIP.stays.find((s) => s.id === 'h-vgo')!
  const apt = TRIP.stays.find((s) => s.id === 'h-mad2')!

  it('Booking de hostel usa fechas de la estancia y filtro de hostels', () => {
    const url = bookingSearchUrl(vigo)
    assert.match(url, /ss=Vigo/)
    assert.match(url, /checkin=2026-11-06&checkout=2026-11-09/)
    assert.match(url, /group_adults=1/)
    assert.match(url, /ht_id%3D203/)
  })

  it('Booking y Airbnb de apartamento usan 2 personas', () => {
    assert.match(
      bookingSearchUrl(apt, 'Chamberí, Madrid'),
      /ss=Chamber%C3%AD%2C\+Madrid.*group_adults=2.*ht_id%3D201/,
    )
    assert.match(
      airbnbSearchUrl(apt, 'Chamberí'),
      /Chamber%C3%AD--Madrid.*checkin=2026-11-21&checkout=2026-11-26&adults=2/,
    )
  })
})

describe('traslados y medio de transporte', () => {
  const legs = TRIP.transfers.filter((t) => !t.excursion)

  it('los tramos entre ciudades forman una cadena continua Madrid → … → Madrid', () => {
    assert.equal(legs[0]?.from, 'madrid')
    assert.equal(legs.at(-1)?.to, 'madrid')
    legs.slice(1).forEach((leg, i) => assert.equal(leg.from, legs[i]?.to, leg.id))
    assert.equal(legs.length, 7)
  })

  it('cada tramo apunta a ciudades que existen y tiene un medio previsto', () => {
    for (const t of TRIP.transfers) {
      assert.ok(TRIP.cities[t.from] && TRIP.cities[t.to], t.id)
      assert.ok(['air', 'train', 'bus'].includes(t.defaultMode), t.id)
    }
  })

  it('el título del evento de traslado sigue al medio elegido', () => {
    const base = EMPTY_BOOKING_STATE
    const day6 = (s: BookingState) =>
      eventsOfDay(TRIP, 6, s).find((e) => e.transferId === 't-1')?.title
    assert.equal(day6(base), 'Tren a Vigo')
    assert.equal(day6(setTransportMode(base, 't-1', 'air', 1)), 'Avión a Vigo')
    assert.equal(day6(setTransportMode(base, 't-1', 'bus', 1)), 'Bus a Vigo')
    const day12 = (s: BookingState) =>
      eventsOfDay(TRIP, 12, s).find((e) => e.transferId === 't-4')?.title
    assert.equal(day12(base), 'Avión a Roma')
    assert.equal(day12(setTransportMode(base, 't-4', 'train', 1)), 'Tren a Roma')
  })

  it('modeOf usa lo registrado y, si no, lo previsto', () => {
    const t1 = TRIP.transfers.find((t) => t.id === 't-1')!
    assert.equal(modeOf(EMPTY_BOOKING_STATE, t1), 'train')
    assert.equal(modeOf(setTransportMode(EMPTY_BOOKING_STATE, 't-1', 'air', 1), t1), 'air')
  })

  it('los eventos enlazados a un traslado referencian tramos reales', () => {
    for (const e of TRIP.agenda.filter((x) => x.transferId)) {
      assert.ok(
        TRIP.transfers.some((t) => t.id === e.transferId),
        e.title,
      )
    }
  })
})
