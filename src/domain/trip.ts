/**
 * Modelo del viaje. Solo tipos: no depende de React, del navegador ni de ninguna librería.
 * Los días se expresan como día del mes de noviembre de 2026.
 */
import type { PriceRange } from './money'

export type CityId =
  | 'madrid'
  | 'toledo'
  | 'santiago'
  | 'vigo'
  | 'porto'
  | 'guimaraes'
  | 'roma'
  | 'florencia'
  | 'barcelona'
  | 'paris'
  | 'segovia'
  | 'saopaulo'

export type PlaceIcon =
  | 'arch'
  | 'dome'
  | 'tower'
  | 'bridge'
  | 'museum'
  | 'tree'
  | 'wave'
  | 'boat'
  | 'castle'
  | 'market'
  | 'book'
  | 'hill'
  | 'station'
  | 'city'
  | 'spires'
  | 'stadium'
  | 'fork'

export interface Coordinates {
  readonly lon: number
  readonly lat: number
}

export interface Place {
  readonly icon: PlaceIcon
  readonly title: string
  readonly description: string
}

export interface City {
  readonly id: CityId
  readonly name: string
  readonly subtitle: string
  readonly coordinates: Coordinates
  readonly places: readonly Place[]
}

/** Un día del itinerario (calendario). */
export interface DayPlan {
  readonly day: number
  /** Etiqueta de ciudad que se muestra en calendario y agenda, p. ej. "Madrid → Vigo". */
  readonly cityLabel: string
  /** Ciudad cuyo carrusel de lugares abre el día. */
  readonly cityId: CityId
  readonly kind: 'stay' | 'travel' | 'excursion'
  readonly plan: string
  /** Qué hay que reservar para ese día (vacío si nada). */
  readonly reserve: string
}

export type LodgingKind = 'hostel' | 'apartment'

export interface Stay {
  readonly id: string
  readonly name: string
  readonly cityId: CityId
  readonly kind: LodgingKind
  /** Día de entrada y de salida (la salida no cuenta como noche). */
  readonly checkIn: number
  readonly checkOut: number
  readonly guests: number
  /** Texto de búsqueda para Booking. */
  readonly searchTerm: string
  readonly altUrl: string
  readonly altLabel: string
  /** Precio por noche (cama en dormitorio para hostels; apartamento completo para apartment). */
  readonly nightly: PriceRange
  /** Cargos únicos de la estancia (limpieza, comisión). */
  readonly fees?: PriceRange
  readonly priceNote: string
}

export interface Link {
  readonly label: string
  readonly url: string
}

export type TransportMode = 'air' | 'train' | 'bus'

export interface Transfer {
  readonly id: string
  readonly from: CityId
  readonly to: CityId
  /** Medio previsto en el plan; el usuario puede cambiarlo después de viajar. */
  readonly defaultMode: TransportMode
  readonly dateLabel: string
  readonly title: string
  readonly description: string
  /** Una excursión desde la ciudad base: el precio es ida y vuelta. */
  readonly excursion: boolean
  readonly price: PriceRange
  readonly priceNote: string
  readonly compare: readonly Link[]
  readonly buy: readonly Link[]
}

export interface Ticket {
  readonly id: string
  readonly dateLabel: string
  readonly cityLabel: string
  readonly title: string
  readonly url: string
  readonly urlLabel: string
  readonly note: string
  readonly extraLink?: Link
}

export type AgendaEventKind = 'trip' | 'visit' | 'res' | 'free' | 'info'

export interface AgendaEvent {
  readonly day: number
  /** Si el evento es un traslado, su título depende del medio elegido para ese tramo. */
  readonly transferId?: string
  readonly time?: string
  readonly title: string
  readonly note: string
  readonly kind: AgendaEventKind
}

export interface BudgetLine {
  readonly concept: string
  readonly price: PriceRange
}

export interface Flight {
  readonly code: string
  readonly route: string
  readonly day: number
  readonly time: string
  readonly kind: 'arrival' | 'departure'
}

export interface TextTip {
  readonly title: string
  readonly text: string
}

/** Zona de Madrid donde buscar el apartamento privado. */
export interface LodgingZone {
  readonly id: string
  readonly name: string
  readonly places: string
  readonly description: string
  readonly priceNote?: string
  readonly bookingTerm: string
  readonly airbnbTerm: string
}

export interface MadridGuide {
  readonly lead: string
  readonly routeNote: string
  readonly bernabeuIntro: string
  readonly bernabeuTips: readonly TextTip[]
  readonly bernabeuBuyUrl: string
  readonly zonesLead: string
  readonly zones: readonly LodgingZone[]
  readonly zonesAvoid: string
  readonly beforeBooking: readonly string[]
  readonly budgetNote: string
  readonly sources: readonly Link[]
}

export interface ChecklistItem {
  readonly text: string
  readonly links?: readonly Link[]
}

/** Textos largos de cada pestaña que mencionan importes (por eso viajan dentro del viaje). */
export interface Guides {
  readonly madrid: MadridGuide
  readonly transportWarn: string
  readonly travelChecklist: readonly ChecklistItem[]
}

export interface Trip {
  readonly title: string
  readonly home: { readonly label: string }
  /** Primer y último día del itinerario detallado. */
  readonly firstDay: number
  readonly lastDay: number
  readonly cities: Readonly<Record<CityId, City>>
  readonly days: readonly DayPlan[]
  readonly stays: readonly Stay[]
  readonly transfers: readonly Transfer[]
  readonly tickets: readonly Ticket[]
  readonly agenda: readonly AgendaEvent[]
  /** Vuelos de la reserva compartida que condicionan los días 21 y 26. */
  readonly sharedFlights: readonly Flight[]
  readonly madridBudget: readonly BudgetLine[]
  readonly bernabeuPrices: readonly BudgetLine[]
  readonly guides: Guides
}
