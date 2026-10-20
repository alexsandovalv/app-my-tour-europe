import type { Guides } from '../../domain/trip'

/** Textos largos de cada pestaña. Los importes van en euros y se presentan en dólares. */
export const GUIDES: Guides = {
  madrid: {
    lead: 'Cinco días en Madrid, del sábado 21 al jueves 26. Aquí están el cambio de ruta, el apartamento, el tour del Bernabéu y el plan día por día.',
    routeNote:
      'París queda en 2 noches (19 a 21 nov) y vuelas a Madrid el sábado 21 por la mañana. Vuelos de la reserva compartida: el PU302 Lima–Madrid aterriza el sábado 21 a las 12:45 y el PU301 Madrid–Lima sale el jueves 26 a las 11:00. Tu vuelo a São Paulo sale a las 13:50 del mismo jueves.',
    bernabeuIntro:
      'Visita con museo del Real Madrid, vista panorámica del estadio, vestuarios y banquillos. Incluye muchas escaleras.',
    bernabeuTips: [
      {
        title: 'Por qué el miércoles.',
        text: 'Vestuarios y banquillos cierran el día del partido y el día anterior. El Real Madrid juega en casa contra el Celta el 21 o 22 (día y hora por confirmar) y contra el PSV el martes 24 a las 21:00 (Champions). Los vestuarios cierran el sábado 21 o el domingo 22 según el día del partido contra el Celta, y seguro el lunes 23 y el martes 24 por el PSV. El miércoles 25 queda libre.',
      },
      {
        title: 'Horario.',
        text: 'Lunes a sábado de 9:00 a 19:00. El martes 24 es reducido, de 9:00 a 15:30.',
      },
      {
        title: 'Compra.',
        text: 'En la web oficial; en taquilla cuesta unos €3 más. La entrada es válida solo para la fecha y hora elegidas y no admite cambios ni reembolsos, así que compra cuando tengas confirmadas las fechas de los vuelos.',
      },
      {
        title: 'Cómo llegar.',
        text: 'Metro Santiago Bernabéu (línea 10). Hay obras en esa línea según una guía: verifica o baja en Nuevos Ministerios y camina.',
      },
      {
        title: 'Entradas de partido.',
        text: 'Si quieres ir al Celta o al PSV, compra solo en la web oficial del club. Son caras y no entran en el presupuesto de abajo.',
      },
    ],
    bernabeuBuyUrl: 'https://www.realmadrid.com/tour-bernabeu',
    zonesLead:
      'Busco una zona tranquila, con metro y a un paseo corto de los museos, sin pagar precio de Sol. Las cifras salen de guías y varían mucho; el precio real lo ves en Booking o Airbnb con tus fechas.',
    zones: [
      {
        id: 'chamberi',
        name: 'Chamberí: mi recomendación',
        places: 'Trafalgar · Almagro · Arapiles · Plaza de Olavide',
        description:
          'Barrio residencial y local, con bares tranquilos en Calle Ponzano y la Plaza de Olavide. Tiene muchas líneas de metro, y con la línea 2 o 4 llegas al Retiro en unos 10 minutos. Queda más cerca del Bernabéu que el Retiro.',
        priceNote:
          'Las fuentes dan rangos muy distintos: de €40 a €70 en unas y de €100 a €180 en otras por noche, por un apartamento de una habitación. En noviembre, temporada baja, presupuesta de €80 a €130 por noche (estimación).',
        bookingTerm: 'Chamberí, Madrid',
        airbnbTerm: 'Chamberí',
      },
      {
        id: 'retiro',
        name: 'Retiro e Ibiza: la opción cómoda para los museos',
        places: 'Junto al parque, el Prado y Atocha',
        description:
          'Estás a pie del Prado, el Thyssen y el parque, con Atocha cerca para el tren. Es más turístico y más caro: una guía cita hoteles de €150 a €250 por noche en la zona y no encontré precios de apartamentos, así que compara tú.',
        bookingTerm: 'Retiro, Madrid',
        airbnbTerm: 'Retiro',
      },
      {
        id: 'arganzuela',
        name: 'Arganzuela: la más económica',
        places: 'Atocha · Delicias · Legazpi',
        description:
          'Tranquila y bien comunicada, junto a la estación de Atocha. Una guía da de €35 a €60 por noche por un estudio, cifra que veo baja para noviembre y para dos personas. Tiene menos encanto de barrio que Chamberí.',
        bookingTerm: 'Arganzuela, Madrid',
        airbnbTerm: 'Arganzuela',
      },
    ],
    zonesAvoid:
      'Evita Sol, La Latina y Malasaña si quieres dormir tranquilos: son céntricos pero ruidosos de noche. Lavapiés es más barato y también ruidoso.',
    beforeBooking: [
      'Pide que el anuncio muestre su número de registro de vivienda turística. Sin número, trátalo como no autorizado.',
      'Comprueba que tenga ascensor y calefacción: en noviembre hace frío.',
      'Elige tarifa con cancelación gratuita y lee las reseñas sobre ruido de la calle.',
      'Suma la tarifa de limpieza y la comisión: una guía las sitúa en €45 a €90 por estancia y del 10 al 14% en Airbnb.',
    ],
    budgetNote:
      'Si pagas entrada completa, cada persona gasta €15 en el Prado, €12 en el Reina Sofía y €14 en el Thyssen. El abono turístico de 5 días cuesta €33,40 por persona y solo compensa si usas mucho el metro; con él evitas el suplemento de €3 del aeropuerto. Las luces de Navidad se encienden a fines de noviembre, en una fecha que el Ayuntamiento anuncia hacia fines de octubre.',
    sources: [
      { label: 'Tour Bernabéu', url: 'https://www.realmadrid.com/tour-bernabeu' },
      {
        label: 'calendario de Liga',
        url: 'https://www.realmadrid.com/es-ES/noticias/futbol/primer-equipo/actualidad/el-calendario-del-real-madrid-para-la-liga-2026-27-30-06-2026',
      },
      {
        label: 'calendario de Champions',
        url: 'https://realmadrid.com/en-US/news/football/first-team/latest-news/calendarios-del-real-madrid-en-la-primera-fase-de-la-champions-2026-27-29-08-2026',
      },
      { label: 'museos gratis', url: 'https://lamaletainquieta.com/?p=4769' },
      {
        label: 'apartamentos en Madrid',
        url: 'https://www.madridtourism.org/airbnb-madrid-apartments/',
      },
      {
        label: 'Retiro o Chamberí',
        url: 'https://eurovistatrips.com/es/retiro-o-chamberi-madrid-guia/',
      },
      {
        label: 'barrios económicos',
        url: 'https://eurovistatrips.com/es/donde-alojarse-en-madrid-barato-3/',
      },
    ],
  },
  transportWarn:
    'Porto a Roma y Barcelona a París son vuelos: el traslado desde un aeropuerto secundario puede costar de €5 a €15 extra. Confirma el horario del bus Vigo a Porto unos días antes, porque el tren sigue sustituido por buses.',
  travelChecklist: [
    {
      text: 'Guarda capturas de todas las reservas y descarga los billetes en el celular, por si no hay señal.',
    },
    { text: 'Anota en tu calendario la fecha límite de cancelación gratuita de cada hostel.' },
    {
      text: 'El Thyssen es gratis el lunes de 12:00 a 16:00. Si entras al Alcázar de Segovia, reserva con anticipación.',
      links: [
        { label: 'museothyssen.org', url: 'https://www.museothyssen.org' },
        { label: 'alcazardesegovia.com', url: 'https://www.alcazardesegovia.com' },
      ],
    },
  ],
}
