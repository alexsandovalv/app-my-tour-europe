# Decisiones de arquitectura

## ADR-1: React + Vite + TypeScript

**Contexto.** La app es un planificador personal: una sola persona la usa, desde el celular en pleno viaje, con
datos estáticos (itinerario, precios) y un poco de estado propio (qué reservas ya hizo y su enlace). Tiene
interacciones locales (pestañas, mapa clicable, carrusel en ventana modal, cuadrícula de agenda, campos de
enlace) y no necesita servidor propio ni SEO.

| Opción                | A favor                                                                                                                               | En contra para este caso                                                                                                                        |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **React + Vite + TS** | Interfaz con mucho estado local; build estático que se sirve en cualquier hosting; ecosistema de tipos y pruebas; recarga instantánea | Hay que cuidar la separación de capas a mano (lo hacemos con la regla de dependencia y un test)                                                 |
| **NestJS**            | Excelente para APIs con módulos, inyección de dependencias y persistencia                                                             | No hay backend que justificar: añadiría servidor, base de datos y despliegue para guardar un puñado de enlaces                                  |
| **Astro**             | Ideal para contenido mayormente estático, con poco JavaScript                                                                         | La mitad de la app es interactiva (estado de reservas sincronizado, modal, agenda); sería una isla de React gigante dentro de un sitio estático |

**Decisión.** React + Vite + TypeScript estricto. Si más adelante se quisiera una API propia (cuentas, varios
viajes), la capa `application` ya define los puertos (`TripSource`, `BookingStore`): se añadiría un adaptador
HTTP en `infrastructure` sin tocar dominio ni pantallas.

## ADR-2: Arquitectura limpia en cuatro capas

`domain` → `application` → `infrastructure` / `presentation`, unidas en `composition.ts`.
Las reglas de negocio (conversión a dólares, etiqueta de ciudad por día, cuadrícula de noviembre, resolución de
sincronización) viven en el dominio como funciones puras, por eso se prueban sin navegador. La regla de
dependencia está verificada por `tests/architecture.test.ts`.

## ADR-3: Importes capturados en euros, presentados en dólares

Los proveedores cotizan en euros; copiar las cifras tal cual evita errores de transcripción. La conversión se
hace una vez, con un tipo de cambio explícito y con fecha, en un caso de uso. Así cambiar de moneda o de
cotización no toca ni las pantallas ni los datos.

## ADR-4: Tests con `node:test`

El núcleo es TypeScript puro, así que el ejecutor nativo de Node basta y evita otra dependencia. Las pruebas de
interfaz se hicieron con Playwright contra el build empaquetado; no se incluyen en el repositorio.

## ADR-5: HTML único opcional

`npm run build:single` empaqueta todo en un solo HTML con esbuild. Sirve para abrir la app sin servidor y para
publicarla como artefacto de Claude, donde los datos compartidos usan su capacidad `db`
(`infrastructure/storage/claudeDb.ts`), que queda inactiva fuera de ese entorno.
