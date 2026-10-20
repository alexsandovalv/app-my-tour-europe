import type { City, CityId } from '../../domain/trip'

/** Ciudades, excursiones y los lugares que muestra el carrusel de cada una. */
export const CITIES: Readonly<Record<CityId, City>> = {
  madrid: {
    id: 'madrid',
    name: 'Madrid',
    country: 'es',
    subtitle: '3 a 6 nov y 21 a 26 nov',
    coordinates: {
      lon: -3.7,
      lat: 40.42,
    },
    places: [
      {
        icon: 'arch',
        title: 'Puerta del Sol',
        description:
          'El punto de partida: aquí está el kilómetro cero de las carreteras de España y el reloj de las campanadas de Nochevieja.',
      },
      {
        icon: 'arch',
        title: 'Plaza Mayor',
        description:
          'Plaza porticada del siglo XVII a pocos pasos de Sol. Al lado queda el Mercado de San Miguel para las tapas.',
      },
      {
        icon: 'museum',
        title: 'Palacio Real',
        description:
          'Palacio oficial de la monarquía, usado para ceremonias. Por fuera se ve gratis, y los jardines de Sabatini están al lado.',
      },
      {
        icon: 'hill',
        title: 'Templo de Debod',
        description:
          'Templo egipcio del siglo II a. C., regalado a España en 1968 y reconstruido en el Parque del Oeste. Muy buen lugar para el atardecer.',
      },
      {
        icon: 'tree',
        title: 'Parque del Retiro',
        description:
          'El gran parque de la ciudad, con el estanque y el Palacio de Cristal. Ideal para la mañana libre del 6 de nov.',
      },
      {
        icon: 'museum',
        title: 'Museo del Prado',
        description:
          'Velázquez, Goya y El Greco. Tiene entrada gratuita en horario de tarde; la tienes anotada para el miércoles 25.',
      },
      {
        icon: 'museum',
        title: 'Museo Reina Sofía',
        description:
          'Aquí está el Guernica de Picasso. Gratis de 19:00 a 21:00 el lunes 23; cierra los martes.',
      },
      {
        icon: 'market',
        title: 'El Rastro',
        description:
          'El mercadillo de los domingos en La Latina. Cierra hacia las 15:00, así que llega temprano el 22 de nov.',
      },
      {
        icon: 'stadium',
        title: 'Estadio Santiago Bernabéu',
        description:
          'Museo del Real Madrid, sala de trofeos, vista panorámica del campo y vestuarios. Tu tour es el miércoles 25 por la mañana: reserva en línea.',
      },
    ],
  },
  toledo: {
    id: 'toledo',
    name: 'Toledo',
    country: 'es',
    subtitle: 'Excursión del jueves 5 nov desde Madrid',
    coordinates: {
      lon: -4.02,
      lat: 39.86,
    },
    places: [
      {
        icon: 'castle',
        title: 'Casco antiguo',
        description:
          'Ciudad amurallada sobre un meandro del Tajo, Patrimonio de la Humanidad desde 1986.',
      },
      {
        icon: 'dome',
        title: 'Catedral Primada',
        description: 'Una de las grandes catedrales góticas de España, iniciada en el siglo XIII.',
      },
      {
        icon: 'bridge',
        title: 'Puente de San Martín',
        description: 'Puente medieval sobre el Tajo, con arcos y torres en ambos extremos.',
      },
      {
        icon: 'hill',
        title: 'Mirador del Valle',
        description:
          'Al otro lado del río: la vista panorámica de toda la ciudad, ideal para fotos al final de la tarde.',
      },
      {
        icon: 'arch',
        title: 'Santa María la Blanca',
        description:
          'Antigua sinagoga de fines del siglo XII, con arcos de herradura y columnas blancas.',
      },
    ],
  },
  santiago: {
    id: 'santiago',
    name: 'Santiago de Compostela',
    country: 'es',
    subtitle: 'Excursión del sábado 7 nov desde Vigo · tren de 1 h 10 min aprox.',
    coordinates: {
      lon: -8.54,
      lat: 42.88,
    },
    places: [
      {
        icon: 'dome',
        title: 'Catedral y Plaza del Obradoiro',
        description:
          'Final del Camino de Santiago. La fachada barroca mira a la plaza donde llegan los peregrinos.',
      },
      {
        icon: 'arch',
        title: 'Casco antiguo',
        description: 'Calles de piedra, soportales y lluvia fina. Patrimonio de la Humanidad.',
      },
      {
        icon: 'market',
        title: 'Mercado de Abastos',
        description:
          'Puestos de pescado, queso y producto gallego. Buen lugar para el almuerzo del sábado 7.',
      },
      {
        icon: 'tree',
        title: 'Parque de la Alameda',
        description: 'Paseo con árboles y una de las mejores vistas de la catedral a lo lejos.',
      },
    ],
  },
  vigo: {
    id: 'vigo',
    name: 'Vigo',
    country: 'es',
    subtitle: '6 a 9 nov · 3 noches',
    coordinates: {
      lon: -8.72,
      lat: 42.24,
    },
    places: [
      {
        icon: 'fork',
        title: 'Casco Vello y ostras',
        description:
          'Calles empedradas y la Rúa da Pescadería, famosa por las ostras que se comen de pie.',
      },
      {
        icon: 'hill',
        title: 'Monte O Castro',
        description:
          'Parque en lo alto con restos de un castro y vista de toda la ría y las islas Cíes.',
      },
      {
        icon: 'boat',
        title: 'Islas Cíes',
        description:
          'Islas del Parque Nacional Illas Atlánticas, con la playa de Rodas. En otoño hay pocas salidas: confirma el barco con Mar de Ons.',
      },
      {
        icon: 'museum',
        title: 'MARCO',
        description:
          'Museo de arte contemporáneo en pleno centro. Buen plan si el día amanece lluvioso.',
      },
      {
        icon: 'tree',
        title: 'Pazo y parque de Castrelos',
        description: 'Jardines tranquilos con un pazo y museo. Paseo fácil para la tarde.',
      },
      {
        icon: 'wave',
        title: 'Playa de Samil',
        description: 'La playa larga de la ciudad; en noviembre es para caminar.',
      },
    ],
  },
  porto: {
    id: 'porto',
    name: 'Porto',
    country: 'pt',
    subtitle: '9 a 12 nov · 3 noches',
    coordinates: {
      lon: -8.61,
      lat: 41.15,
    },
    places: [
      {
        icon: 'arch',
        title: 'Ribeira',
        description:
          'Fachadas de colores junto al Duero, en el centro histórico Patrimonio de la Humanidad.',
      },
      {
        icon: 'bridge',
        title: 'Ponte Dom Luís I',
        description: 'Puente de hierro de dos niveles, de 1886. Se cruza a pie hasta Gaia.',
      },
      {
        icon: 'station',
        title: 'Estación de São Bento',
        description:
          'El vestíbulo está cubierto de unos 20.000 azulejos pintados con escenas históricas.',
      },
      {
        icon: 'book',
        title: 'Librería Lello',
        description:
          'Librería neogótica con una escalera roja famosa. Se paga entrada y conviene comprarla en línea.',
      },
      {
        icon: 'market',
        title: 'Mercado do Bolhão',
        description: 'Mercado histórico que reabrió en 2022 tras una larga reforma.',
      },
      {
        icon: 'hill',
        title: 'Gaia al atardecer',
        description:
          'Desde los miradores de Gaia y el Jardim do Morro se ve la ciudad dorarse sobre el río.',
      },
    ],
  },
  guimaraes: {
    id: 'guimaraes',
    name: 'Guimarães o Aveiro',
    country: 'pt',
    subtitle: 'Excursión del miércoles 11 nov desde Porto · elige una',
    coordinates: {
      lon: -8.3,
      lat: 41.44,
    },
    places: [
      {
        icon: 'castle',
        title: 'Castillo de Guimarães',
        description: 'Castillo medieval al que llaman la cuna de Portugal.',
      },
      {
        icon: 'castle',
        title: 'Paço dos Duques',
        description: 'Palacio del siglo XV en el centro histórico de Guimarães.',
      },
      {
        icon: 'boat',
        title: 'Canales de Aveiro',
        description: 'Los barcos moliceiros pintados recorren los canales de la ciudad.',
      },
      {
        icon: 'arch',
        title: 'Costa Nova',
        description: 'Casas de rayas de colores frente al mar, a unos minutos de Aveiro.',
      },
    ],
  },
  roma: {
    id: 'roma',
    name: 'Roma',
    country: 'it',
    subtitle: '12 a 14 nov · 2 noches',
    coordinates: {
      lon: 12.5,
      lat: 41.9,
    },
    places: [
      {
        icon: 'dome',
        title: 'Panteón',
        description:
          'Templo romano de unos 1.900 años con una cúpula de hormigón que sigue en pie. Cuenta con un óculo abierto al cielo.',
      },
      {
        icon: 'wave',
        title: 'Fontana de Trevi',
        description:
          'La fuente barroca más famosa de Roma. Ve temprano o de noche para encontrar menos gente.',
      },
      {
        icon: 'arch',
        title: 'Piazza Navona',
        description: 'Plaza ovalada con tres fuentes y artistas callejeros.',
      },
      {
        icon: 'arch',
        title: 'Coliseo y Foro Romano',
        description:
          'El anfiteatro y el centro de la antigua Roma. La entrada incluye ambos; reserva en línea.',
      },
      {
        icon: 'fork',
        title: 'Trastevere',
        description: 'Barrio de calles estrechas y trattorias, bueno para cenar el viernes.',
      },
      {
        icon: 'dome',
        title: 'Vaticano',
        description:
          'Basílica de San Pedro y Museos Vaticanos. Plan opcional para el sábado a primera hora.',
      },
    ],
  },
  florencia: {
    id: 'florencia',
    name: 'Florencia',
    country: 'it',
    subtitle: '14 a 16 nov · 2 noches',
    coordinates: {
      lon: 11.26,
      lat: 43.77,
    },
    places: [
      {
        icon: 'dome',
        title: 'Duomo',
        description:
          'La catedral de Santa Maria del Fiore y su cúpula de Brunelleschi, que domina la ciudad.',
      },
      {
        icon: 'bridge',
        title: 'Ponte Vecchio',
        description: 'Puente medieval con joyerías sobre el Arno.',
      },
      {
        icon: 'hill',
        title: 'Piazzale Michelangelo',
        description: 'Mirador con la mejor vista de la ciudad al atardecer.',
      },
      {
        icon: 'museum',
        title: 'Galería de la Academia',
        description:
          'Aquí está el David de Miguel Ángel. Es la opción corta si no quieres los Uffizi.',
      },
      {
        icon: 'museum',
        title: 'Galería Uffizi',
        description: 'Botticelli, Leonardo y Caravaggio. Más larga; elige esta o la Academia.',
      },
      {
        icon: 'tower',
        title: 'Torre de Pisa',
        description: 'Excursión opcional en tren desde Florencia, a poco más de una hora.',
      },
    ],
  },
  barcelona: {
    id: 'barcelona',
    name: 'Barcelona',
    country: 'es',
    subtitle: '16 a 19 nov · 3 noches',
    coordinates: {
      lon: 2.17,
      lat: 41.39,
    },
    places: [
      {
        icon: 'arch',
        title: 'Barrio Gótico',
        description: 'Calles medievales alrededor de la catedral, con plazas escondidas.',
      },
      {
        icon: 'dome',
        title: 'El Born y Santa María del Mar',
        description: 'Basílica gótica catalana del siglo XIV rodeada de bares y tiendas.',
      },
      {
        icon: 'wave',
        title: 'Barceloneta',
        description: 'Playa urbana con paseo marítimo; en noviembre se disfruta caminando.',
      },
      {
        icon: 'spires',
        title: 'Sagrada Família',
        description: 'Basílica de Gaudí en construcción desde 1882. Reserva con anticipación.',
      },
      {
        icon: 'hill',
        title: 'Park Güell',
        description: 'Parque de Gaudí con mosaicos y vistas. La zona monumental es de pago.',
      },
      {
        icon: 'hill',
        title: 'Búnkeres del Carmel',
        description: 'Antiguas baterías antiaéreas, hoy un mirador gratis con vista de 360 grados.',
      },
      {
        icon: 'fork',
        title: 'Gràcia',
        description: 'Barrio de plazas y bares con ambiente local, bueno para la noche.',
      },
    ],
  },
  paris: {
    id: 'paris',
    name: 'París',
    country: 'fr',
    subtitle: '19 a 21 nov · 2 noches',
    coordinates: {
      lon: 2.35,
      lat: 48.86,
    },
    places: [
      {
        icon: 'dome',
        title: 'Montmartre y Sacré-Cœur',
        description: 'Colina de artistas con una basílica blanca y vista de la ciudad.',
      },
      {
        icon: 'museum',
        title: 'Museo del Louvre',
        description: 'El museo más visitado del mundo, con la Mona Lisa. Reserva franja horaria.',
      },
      {
        icon: 'station',
        title: 'Museo de Orsay',
        description:
          'Antigua estación convertida en museo de impresionistas. Alternativa más corta al Louvre.',
      },
      {
        icon: 'dome',
        title: 'Notre-Dame',
        description:
          'Catedral gótica reabierta en diciembre de 2024 tras el incendio de 2019. Verla por fuera es gratis.',
      },
      {
        icon: 'tower',
        title: 'Torre Eiffel',
        description:
          'Mejor de noche, cuando se ilumina. Verla desde los puentes sobre el Sena no cuesta nada.',
      },
      {
        icon: 'arch',
        title: 'Le Marais',
        description:
          'Barrio de calles medievales, tiendas y falafel. Pásalo por la tarde del viernes 20.',
      },
      {
        icon: 'wave',
        title: 'Canal Saint-Martin',
        description:
          'Canal con puentes de hierro y cafés. Buen plan si te sobra tiempo el viernes 20.',
      },
    ],
  },
  segovia: {
    id: 'segovia',
    name: 'Segovia',
    country: 'es',
    subtitle: 'Excursión del martes 24 nov desde Madrid',
    coordinates: {
      lon: -4.12,
      lat: 40.95,
    },
    places: [
      {
        icon: 'arch',
        title: 'Acueducto',
        description: 'Acueducto romano de dos pisos de arcos, hecho de piedra sin argamasa.',
      },
      {
        icon: 'castle',
        title: 'Alcázar',
        description: 'Fortaleza sobre un peñón; entrar es opcional y se reserva en línea.',
      },
      {
        icon: 'dome',
        title: 'Catedral',
        description: 'Catedral gótica tardía en la Plaza Mayor, apodada la Dama de las Catedrales.',
      },
      {
        icon: 'fork',
        title: 'Cochinillo asado',
        description: 'El plato típico de la ciudad. Prueba medio cochinillo si vas con alguien.',
      },
    ],
  },
  saopaulo: {
    id: 'saopaulo',
    name: 'São Paulo',
    country: 'br',
    subtitle: 'Escala: llegas el 26 nov a las 20:35 y sales el 27 a las 6:30',
    coordinates: {
      lon: -46.63,
      lat: -23.55,
    },
    places: [
      {
        icon: 'city',
        title: 'Avenida Paulista',
        description:
          'La avenida de rascacielos y centros culturales; con luz de noche se puede caminar.',
      },
      {
        icon: 'fork',
        title: 'Vila Madalena',
        description:
          'Barrio de bares y murales, con el famoso Beco do Batman. Cena y paseo antes de volver al aeropuerto.',
      },
    ],
  },
}
