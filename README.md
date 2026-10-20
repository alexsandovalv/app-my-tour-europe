# Ruta Europa · app-my-tour-europe

Planificador del viaje **Lima → Madrid → Vigo → Porto → Roma → Florencia → Barcelona → París → Madrid → Lima**,
del 2 al 27 de noviembre de 2026. Mapa con carrusel de lugares por ciudad, calendario, agenda de noviembre,
plan de Madrid (21 a 26), hospedaje, trenes y vuelos, entradas, y seguimiento de cada reserva con su enlace.

Todos los importes se muestran en **dólares estadounidenses (US$)**.

## Cómo correrlo

```bash
npm install
npm run dev        # servidor local con recarga
npm run check      # tipos + lint + tests
npm run build      # build de producción en dist/
npm run build:single   # un solo HTML autocontenido en dist-single/
```

Requiere Node 20 o superior.

## Stack

React 19 + Vite + TypeScript estricto. La justificación frente a Nest y Astro está en
[`docs/DECISIONES.md`](docs/DECISIONES.md).

## Arquitectura

Arquitectura limpia con la regla de dependencia apuntando hacia adentro:

```
src/
├── domain/          Reglas y modelo del viaje. TypeScript puro: sin React, sin navegador.
│   ├── trip.ts        tipos: Trip, DayPlan, Stay, Transfer, Ticket, AgendaEvent…
│   ├── money.ts       PriceRange, conversión EUR → USD, formato
│   ├── calendar.ts    noviembre de 2026 (cuadrícula solo con días de noviembre)
│   ├── agenda.ts      etiqueta de ciudad de cada día, eventos ordenados
│   ├── summary.ts     totales de hospedaje, transporte y presupuesto
│   ├── booking.ts     estados de reserva, validación de enlaces, resolución de sincronización
│   └── links.ts       URLs de búsqueda en Booking y Airbnb
├── application/     Casos de uso y puertos (interfaces).
│   ├── ports.ts       TripSource, ExchangeRateProvider, BookingStore
│   ├── loadTrip.ts    carga el viaje y lo presenta en USD
│   └── bookingService.ts  cambiar estado, pegar/quitar enlace, sincronizar
├── infrastructure/  Implementaciones concretas de los puertos.
│   ├── data/          itinerario, estancias, transportes, entradas, agenda, guías (importes en EUR)
│   ├── fx/            tipo de cambio de referencia del BCE
│   └── storage/       localStorage + sincronización opcional con la capacidad `db` de Claude
├── presentation/    React: componentes y pantallas. Solo usa casos de uso del núcleo.
└── composition.ts   Raíz de composición: único sitio que une puertos con implementaciones.
```

La regla de dependencia no es solo una convención: `tests/architecture.test.ts` recorre los imports reales y
falla si `domain` importa de otra capa, si el núcleo usa React o el DOM, o si `presentation` importa
`infrastructure` directamente. ESLint (`no-restricted-imports`) la refuerza en el editor.

### Dólares

Los proveedores publican en euros, así que los datos se capturan en euros
(`src/infrastructure/data/`) y se convierten **una sola vez**, en `application/loadTrip.ts`, al cambio de
referencia del BCE del 19 de octubre de 2026: **1 € = US$1,1225** (`infrastructure/fx/ecbRate.ts`). La
conversión alcanza a los rangos numéricos y a los importes escritos dentro de los textos (`€45` → `US$51`);
un test comprueba que no queda ningún `€` en lo que ve el usuario. Para actualizar el cambio basta con
editar ese valor.

### Estado de las reservas

El estado (Por reservar / Reservado / Pagado) y el enlace pegado de cada reserva se guardan en
`localStorage` y, cuando la app corre como artefacto de Claude, también en su base compartida
(`viaje/estado`). Gana siempre la versión más reciente (`decideSync`).

## Datos del viaje

- Vigo: 3 noches (6 a 9 nov). **Santiago es una excursión de un día** en tren (1 h 10 min aprox.), el sábado 7.
- Madrid del 21 al 26 en apartamento privado. Tour del Bernabéu el miércoles 25: los vestuarios cierran el
  día del partido y el anterior (Real Madrid–PSV, martes 24).
- Vuelos de la reserva compartida que condicionan los días 21 y 26: PU302 aterriza el 21 a las 12:45; PU301
  sale el 26 a las 11:00. Tu vuelo a São Paulo sale a las 13:50.
- Los precios son **estimaciones** de guías y buscadores del 19 de octubre de 2026. No son disponibilidad ni
  precio final.

## Tests

```bash
npm test
```

Usa el ejecutor nativo de Node (`node:test`) a través de `tsx`, sin dependencias de pruebas adicionales.
Cubren dinero y conversión, integridad de los datos (estancias sin huecos, días consecutivos, ciudades
referenciadas), la agenda de noviembre y sus etiquetas, reglas de reserva y sincronización, almacenamiento
resistente a fallos, la proyección del mapa y la regla de dependencia.

## Despliegue

- **CI** (`.github/workflows/ci.yml`): tipos, lint, tests y build en cada push y pull request.
- **GitHub Pages** (`.github/workflows/pages.yml`): publica `dist/` desde `main`. Hay que activar
  _Settings → Pages → Source: GitHub Actions_ una vez en el repositorio.
