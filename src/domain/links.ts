import type { Stay } from './trip'

const NOVEMBER = (day: number): string => `2026-11-${String(day).padStart(2, '0')}`

/** Booking: ht_id 203 = hostels, 201 = apartamentos. */
export function bookingSearchUrl(stay: Stay, term: string = stay.searchTerm): string {
  const type = stay.kind === 'apartment' ? '201' : '203'
  const params = [
    `ss=${encodeURIComponent(term).replace(/%20/g, '+')}`,
    `checkin=${NOVEMBER(stay.checkIn)}`,
    `checkout=${NOVEMBER(stay.checkOut)}`,
    `group_adults=${stay.guests}`,
    'no_rooms=1',
    `nflt=ht_id%3D${type}`,
  ]
  return `https://www.booking.com/searchresults.es.html?${params.join('&')}`
}

export function airbnbSearchUrl(stay: Stay, zone: string): string {
  const slug = encodeURIComponent(zone)
  const params = [
    `checkin=${NOVEMBER(stay.checkIn)}`,
    `checkout=${NOVEMBER(stay.checkOut)}`,
    `adults=${stay.guests}`,
    'room_types%5B%5D=Entire%20home%2Fapt',
  ]
  return `https://www.airbnb.es/s/${slug}--Madrid--Espa%C3%B1a/homes?${params.join('&')}`
}
