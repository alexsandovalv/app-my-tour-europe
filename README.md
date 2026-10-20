# Ruta Europa · app-my-tour-europe

Planificador del viaje **Lima → Madrid → Vigo → Porto → Roma → Florencia → Barcelona → París → Madrid → Lima**,
del 2 al 27 de noviembre de 2026. Mapa con carrusel de lugares por ciudad, calendario, agenda de noviembre,
plan de Madrid (21 a 26), hospedaje, trenes y vuelos, entradas, y seguimiento de cada reserva con su enlace.

- **Mapa con flechas numeradas (1 a 7)**, cada una del color de la ciudad de destino. El trazo indica el medio:
  continuo = tren, rayas = bus, punteado = avión.
- **Medio de transporte real por tramo**: en _Trenes y vuelos_ eliges si fuiste en avión, tren o bus; el mapa y
  la agenda se actualizan y se conserva el plan original.
- **Pagué y fecha real en cada reserva**: junto al link de cada hospedaje, traslado o entrada se anota lo
  realmente pagado (US$ o EUR, que se convierte) y la fecha confirmada. Un importe marca la reserva como
  _Pagado_; la fecha mueve el traslado de día en la agenda y aparece como «Confirmado» en el calendario
  (las entradas y los check-in se muestran como eventos de ese día).
- **Hecho**: casilla por actividad en la agenda (con contador por día y del mes, «Marcar todo el día» y
  «Día hecho» en el calendario), botón «Hecho» en cada entrada, traslado y hospedaje, y casillas en la lista
  «Antes de salir de Lima». Un traslado marcado en la agenda es el mismo que en «Trenes y vuelos».
- **Presupuesto**: cifras (total, gastado, por pagar, lo que te queda, promedio diario), tabla por
  categoría con presupuestado, real, por pagar y diferencia, dos gráficos (por categoría y gasto diario
  contra el tope) y un registro de gastos del día a día con alerta al pasar el tope diario.
- **Modo día / noche** con un botón en la cabecera (sigue al sistema hasta que lo cambias) y un menú de tema
  con cuatro acentos de color.

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

React 19 + Vite + TypeScript estricto, **Zustand** para el estado y **Tailwind CSS v4** para los estilos
(tema modificable con variables CSS). La justificación frente a Nest y Astro está en
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
│   ├── booking.ts     estados de reserva, medio de transporte elegido, enlaces, sincronización
│   ├── transport.ts   avión / tren / bus y el medio efectivo de cada tramo
│   ├── expenses.ts    gastos del día a día, fechas de noviembre, ajustes de presupuesto
│   ├── budget.ts      presupuesto vs real: partidas, por pagar, tope diario, serie por día
│   ├── preferences.ts tema: modo claro/oscuro/sistema y acento
│   └── links.ts       URLs de búsqueda en Booking y Airbnb
├── application/     Casos de uso y puertos (interfaces).
│   ├── ports.ts       TripSource, ExchangeRateProvider, BookingStore, PreferencesStore
│   └── loadTrip.ts    carga el viaje y lo presenta en USD
├── infrastructure/  Implementaciones concretas de los puertos.
│   ├── data/          itinerario, estancias, transportes, entradas, agenda, guías (importes en EUR)
│   ├── fx/            tipo de cambio de referencia del BCE
│   └── storage/       localStorage + sincronización opcional con la capacidad `db` de Claude
├── presentation/    React + Zustand + Tailwind. Solo usa `application` y `domain`.
│   ├── state/         store de Zustand (navegación, tema, reservas) y su contexto
│   ├── styles/        index.css: Tailwind, tokens del tema, modo oscuro y acentos
│   ├── features/      mapa, calendario, agenda, hospedaje, transporte, entradas, Madrid, ciudad, presupuesto
│   └── components/    iconos, selector de medio, controles de reserva y de tema
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

### Presupuesto

Todo el cálculo está en `domain/budget.ts` (función pura `computeBudget`), así que se prueba sin navegador
(`tests/budget.test.ts`).

- **Total**: lo defines tú; si no, se sugiere con las reservas del plan (punto medio de cada rango) más
  US$70 por día de viaje.
- **Partidas**: hospedaje y traslados parten del estimado del plan; lo que queda del total se reparte entre
  entradas (20 %), comida (40 %), transporte local (15 %), souvenirs (10 %) e imprevistos (el resto), de
  modo que las partidas siempre suman el total.
- **Real**: lo pagado en cada reserva (convertido a US$ con el cambio del BCE si se pagó en euros) más los
  gastos registrados. Una reserva sin importe cuenta en **Por pagar** por su estimado.
- **Diferencia** = presupuestado − real − por pagar.
- **Tope diario**: sugerido con lo presupuestado para comida, transporte local, souvenirs e imprevistos
  entre los días; editable. Los gastos del día a día de cada fecha se comparan contra él.

Los gastos, los importes pagados, las fechas reales y el presupuesto viajan en el mismo estado que las
reservas (`BookingState`), por lo que se guardan en `localStorage` y se sincronizan igual.

### Estado con Zustand

`presentation/state/appStore.ts` crea un store _vanilla_ de Zustand en tres porciones: **navegación**
(pestaña, ciudad abierta, vista de agenda), **tema** y **reservas** (estado, enlaces y medio de transporte).
Las reglas son funciones puras del dominio; el store solo las orquesta y guarda a través de los puertos
`BookingStore` y `PreferencesStore`. La raíz de composición lo crea y lo entrega a React por contexto, de modo
que los tests lo ejercitan sin navegador (`tests/store.test.ts`).

### Tema con Tailwind

`styles/index.css` define los colores como variables CSS (`--bg`, `--ink`, `--accent`…) y las expone a Tailwind
con `@theme inline`; el modo oscuro es la clase `dark` en `<html>` (`@custom-variant dark`) y el acento es
`data-accent` (esmeralda, azul, violeta, terracota). Para crear un tema nuevo basta con añadir un bloque
`html[data-accent='…']` y su nombre en `domain/preferences.ts`. La preferencia se guarda en `localStorage` y se
aplica antes del primer pintado para evitar el destello. El botón día/noche alterna lo que se ve en ese
momento, incluso si el modo era «sistema».

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
- Los tramos por defecto: Madrid → Vigo tren, Vigo → Porto bus, Porto → Roma avión, Roma → Florencia tren,
  Florencia → Barcelona, Barcelona → París y París → Madrid en avión. Se pueden cambiar tramo a tramo.
- Los precios son **estimaciones** de guías y buscadores del 19 de octubre de 2026. No son disponibilidad ni
  precio final.

## Tests

```bash
npm test
```

Usa el ejecutor nativo de Node (`node:test`) a través de `tsx`, sin dependencias de pruebas adicionales.
Cubren dinero y conversión, integridad de los datos (estancias sin huecos, días consecutivos, ciudades
referenciadas), la agenda de noviembre y sus etiquetas, reglas de reserva y de transporte, el store de Zustand,
las preferencias de tema, sincronización, almacenamiento
resistente a fallos, la proyección del mapa y la regla de dependencia.

## Despliegue

- **CI** (`.github/workflows/ci.yml`): tipos, lint, tests y build en cada push y pull request.
- **GitHub Pages** (`.github/workflows/pages.yml`): publica `dist/` desde `main`. Hay que activar
  _Settings → Pages → Source: GitHub Actions_ una vez en el repositorio.
