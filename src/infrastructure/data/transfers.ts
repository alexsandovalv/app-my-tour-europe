import { eur } from '../../domain/money'
import type { Transfer } from '../../domain/trip'

const OMIO = { label: 'Omio', url: 'https://www.omio.es' }
const RENFE = { label: 'Renfe', url: 'https://www.renfe.com' }
const ALSA = { label: 'Alsa', url: 'https://www.alsa.com' }

/** Trenes, buses y vuelos entre ciudades. Precios por persona; las excursiones, ida y vuelta. */
export const TRANSFERS: readonly Transfer[] = [
  {
    id: 't-1',
    from: 'madrid',
    to: 'vigo',
    defaultMode: 'train',
    dateLabel: 'Vie 6 nov',
    title: 'Madrid a Vigo',
    description:
      'Tren directo (AVE o Alvia) de unas 4 h, sin pasar por Santiago. Confirma estación y horario en Renfe',
    excursion: false,
    price: eur(25, 55),
    priceNote:
      'Estimado por el corredor Madrid–Galicia: lo normal está entre €25 y €55. Confirma el precio en Renfe',
    compare: [
      {
        label: 'Vuelos MAD-VGO',
        url: 'https://www.skyscanner.es/transporte/vuelos/mad/vgo/261106/',
      },
      OMIO,
    ],
    buy: [RENFE, { label: 'Alsa (bus)', url: ALSA.url }],
  },
  {
    id: 't-2',
    from: 'vigo',
    to: 'santiago',
    defaultMode: 'train',
    dateLabel: 'Sáb 7 nov',
    title: 'Vigo a Santiago, ida y vuelta',
    description:
      'Excursión del día: tren de 1 h 10 min aprox. por tramo, o bus. Sale desde Vigo y vuelves a dormir allí',
    excursion: true,
    price: eur(14, 30),
    priceNote: 'Desde €7 por tramo; promedio de unos €11',
    compare: [OMIO],
    buy: [RENFE, ALSA],
  },
  {
    id: 't-3',
    from: 'vigo',
    to: 'porto',
    defaultMode: 'bus',
    dateLabel: 'Lun 9 nov',
    title: 'Vigo a Porto',
    description:
      'Bus directo de unas 2 h, con unas 30 salidas al día. El tren está sustituido por buses hasta abril de 2027',
    excursion: false,
    price: eur(10, 29),
    priceNote: 'Desde €7; promedio de €13 a €29 según la fuente',
    compare: [{ label: 'FlixBus', url: 'https://www.flixbus.es' }, OMIO],
    buy: [ALSA],
  },
  {
    id: 't-4',
    from: 'porto',
    to: 'roma',
    defaultMode: 'air',
    dateLabel: 'Jue 12 nov',
    title: 'Porto a Roma',
    description: 'Vuelo directo de 2 h 50 min',
    excursion: false,
    price: eur(38, 90),
    priceNote: 'Desde €38 en Ryanair; en noviembre el promedio ida y vuelta ronda €106',
    compare: [
      {
        label: 'Vuelos OPO-ROM',
        url: 'https://www.skyscanner.es/transporte/vuelos/opo/rome/261112/',
      },
    ],
    buy: [
      { label: 'Ryanair', url: 'https://www.ryanair.com' },
      { label: 'TAP', url: 'https://www.flytap.com' },
    ],
  },
  {
    id: 't-5',
    from: 'roma',
    to: 'florencia',
    defaultMode: 'train',
    dateLabel: 'Sáb 14 nov',
    title: 'Roma a Florencia',
    description: 'Tren de alta velocidad, 1 h 30 min',
    excursion: false,
    price: eur(26, 50),
    priceNote: 'Desde unos €26 con anticipación; promedio de unos €49 comprando el mismo día',
    compare: [OMIO],
    buy: [
      { label: 'Trenitalia', url: 'https://www.trenitalia.com/en.html' },
      { label: 'Italo', url: 'https://www.italotreno.com' },
    ],
  },
  {
    id: 't-6',
    from: 'florencia',
    to: 'barcelona',
    defaultMode: 'air',
    dateLabel: 'Lun 16 nov',
    title: 'Florencia a Barcelona',
    description:
      'Vuelo con Vueling, Iberia o Ryanair; una fuente dice que no hay directo, así que revisa escalas. También sirve Pisa',
    excursion: false,
    price: eur(70, 120),
    priceNote: 'Las fuentes no coinciden: confirma el precio, y compara también Pisa',
    compare: [
      {
        label: 'Vuelos FLR-BCN',
        url: 'https://www.skyscanner.es/transporte/vuelos/flr/bcn/261116/',
      },
    ],
    buy: [{ label: 'Vueling', url: 'https://www.vueling.com' }],
  },
  {
    id: 't-7',
    from: 'barcelona',
    to: 'paris',
    defaultMode: 'air',
    dateLabel: 'Jue 19 nov',
    title: 'Barcelona a París',
    description: 'Vuelo de unas 2 h con Ryanair, Vueling o Transavia, o tren de más de 6 h',
    excursion: false,
    price: eur(45, 110),
    priceNote: 'Ryanair desde €44 y Vueling desde €51; Ryanair llega a Beauvais, lejos del centro',
    compare: [
      {
        label: 'Vuelos BCN-PAR',
        url: 'https://www.skyscanner.es/transporte/vuelos/bcn/pari/261119/',
      },
      OMIO,
    ],
    buy: [
      { label: 'Vueling', url: 'https://www.vueling.com' },
      { label: 'SNCF Connect', url: 'https://www.sncf-connect.com' },
    ],
  },
  {
    id: 't-8',
    from: 'paris',
    to: 'madrid',
    defaultMode: 'air',
    dateLabel: 'Sáb 21 nov',
    title: 'París a Madrid',
    description: 'Vuelo directo de unas 2 h 05 min. Elige uno que aterrice antes de las 12:45',
    excursion: false,
    price: eur(56, 130),
    priceNote: 'Desde €56 por tramo; compra con tiempo',
    compare: [
      {
        label: 'Vuelos PAR-MAD',
        url: 'https://www.skyscanner.es/transporte/vuelos/pari/mad/261121/',
      },
    ],
    buy: [
      { label: 'Iberia', url: 'https://www.iberia.com' },
      { label: 'Transavia', url: 'https://www.transavia.com' },
    ],
  },
  {
    id: 't-9',
    from: 'madrid',
    to: 'segovia',
    defaultMode: 'train',
    dateLabel: 'Mar 24 nov',
    title: 'Madrid a Segovia, ida y vuelta',
    description:
      'Tren de unos 27 min de Chamartín a Segovia-Guiomar; desde la estación hay que tomar un bus al centro',
    excursion: true,
    price: eur(12, 42),
    priceNote: 'Desde unos €6 por tramo hasta unos €21 de promedio según el día',
    compare: [OMIO],
    buy: [RENFE],
  },
]
