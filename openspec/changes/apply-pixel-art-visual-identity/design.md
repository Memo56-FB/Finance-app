# Design

## Context

- Ver `proposal.md` (Why) y las specs `visual-identity` y `color-themes` para los requisitos.
- Tailwind v3 con `tailwind.config.ts`. Los colores del reto (`beige`, `grey`, `green`...) se usan directamente en unos 35 archivos `.tsx` (`bg-white`, `bg-grey-900`, `bg-beige-100`, `text-grey-500`), y los tokens shadcn de `app/globals.css` siguen con los valores neutros por defecto.
- La tipografía es `Public Sans` (`app/ui/fonts.ts`), aplicada en `<body>` desde `app/layout.tsx`. Los presets `.text-preset-1..5` fijan tamaños con `!important`.
- El idioma ya se guarda en la cookie `finance-language` (`lib/i18n/preferences.ts`, `cookie.ts`), se lee en el servidor (`lib/i18n/server.ts`) y se elige en `PreferencesBar` con un `Select` de Radix accesible.
- Los colores de categoría/presupuesto vienen de `lib/finance/colors.ts` y de clases `safelist` (`bg-*`, `fill-*`, `border-*`, `[&::-webkit-progress-value]:bg-*`).
- Hay pruebas Vitest (incluye `tests/interaction-smoke.test.tsx` y `finance-previews.test.tsx`), Playwright e historias de Storybook para Sidebar, SidebarItem, MinimizeMenu, Button, inputs y progreso.

## Goals / Non-Goals

**Goals:**
- Concentrar la identidad en tokens y utilidades para que el cambio por componente sea solo de clases, sin tocar estructura, props ni lógica.
- Cambiar de tema sin recargar ni volver a pedir datos.

**Non-Goals:**
- Cambios de layout, rutas, orden de secciones, contenido o comportamiento.
- Modo claro/oscuro adicional: los tres temas son oscuros.
- Pantalla de título, hotbar, cajón de inventario o diálogos "Undertale" de la propuesta visual; solo se aplica el estilo al layout existente.
- Migrar a Tailwind v4.

## Decisions

### 1. Tokens semánticos por tema con `data-theme` en `<html>`

Definir en `globals.css` variables base (`--bg`, `--panel`, `--line`, `--ink`, `--ink-muted`, `--gold`, `--danger`) y la rampa de tema `--p1..--p4`, sobrescrita por `[data-theme="nether"]` y `[data-theme="diamond"]`. Mapear los tokens shadcn (`--background`, `--card`, `--primary`, `--ring`, `--border`, etc.) a esos valores, y exponer en `tailwind.config.ts` colores semánticos `theme-1..4`, `panel`, `line`, `ink`.

Los nombres antiguos `beige`/`grey` se **reasignan** a los nuevos valores en un primer paso (p. ej. `beige-100` → fondo, `grey-900` → panel oscuro, `bg-white` sustituido por `bg-card`) y luego se sustituyen archivo por archivo por los semánticos.
- *Alternativa*: reemplazo masivo directo de clases. Descartada: alto riesgo de regresiones visuales y diffs enormes difíciles de revisar.
- *Alternativa*: CSS-in-JS/contexto React para el tema. Descartada: requiere hidratar para pintar y produce parpadeo.

### 2. Persistencia en cookie `finance-theme`, leída en el servidor

Extender `preferences.ts` con `theme: 'overworld' | 'nether' | 'diamond'` (por defecto `overworld`, validado), `cookieNames.theme = 'finance-theme'`, y generalizar `savePreference(doc, name, value, secure)` manteniendo la validación por lista blanca. `app/layout.tsx` lee la cookie y escribe `data-theme` en `<html>`, así la primera pintura ya usa el tema (sin script inline).

Al elegir tema, el cliente guarda la cookie y actualiza `document.documentElement.dataset.theme` de inmediato, **sin `router.refresh()`**, porque solo cambia CSS y la spec exige no volver a pedir datos. Si guardar falla, se revierte el atributo y se muestra el toast de error existente (`role="alert"`).
- *Alternativa*: `localStorage`. Descartada: el servidor no lo ve y habría parpadeo del tema por defecto.

### 3. Selector de tema dentro de `PreferencesBar`

Añadir un segundo `Select` con el mismo patrón que el de idioma: `<label class="sr-only">`, `id` propio, foco visible, `aria-busy` y muestra de color con `aria-hidden`. Ambos selectores quedan en la misma fila superior derecha que ya existe, así no cambia el layout.

### 4. Bordes pixelados con `box-shadow` escalonado, no `clip-path`

Crear utilidades en `@layer components`: `.px-frame` (marco de 4 px con esquinas escalonadas mediante sombras múltiples), `.px-bevel` (luz arriba/izquierda, sombra abajo/derecha con la rampa del tema), `.px-inset` (campos hundidos) y `.px-bar` (relleno segmentado con `repeating-linear-gradient`). Poner `--radius: 0` para que los componentes shadcn pierdan el redondeo.
- *Alternativa*: `clip-path` con polígono escalonado (usado en el artefacto). Descartada para la app: recorta el `outline` de foco y las sombras, lo que rompería el foco visible requerido.

### 5. Foco visible global

Una regla `:focus-visible` base con `outline: 3px solid var(--focus)` y `outline-offset: 2px`, donde `--focus` es dorado (contraste ≥3:1 sobre `--bg`, `--panel` y las rampas). Se conservan las clases `focus-visible:*` existentes, ajustadas solo de color.

### 6. Fuentes con `next/font/google`

`Press_Start_2P` (títulos/cifras, `--font-heading`) y `Pixelify_Sans` (texto, `--font-sans`), con `display: 'swap'`. Los presets se reasignan: `text-preset-1/2` y montos usan la fuente de títulos con tamaños reducidos (Press Start es muy ancha; p. ej. 32 px → 22 px); `text-preset-3..5` usan Pixelify con mínimo 14 px para texto de lectura. `text-preset-5` (12 px) queda solo para etiquetas cortas no esenciales, como hoy.

### 7. Imágenes y marca

- Logotipo `finance` como texto pixelado en un componente `BrandLogo` (texto real, accesible, sin SVG del reto) y un icono de corazón pixelado `public/brand/heart.svg` para la barra minimizada y el favicon.
- Escena de acceso/registro generada (`public/brand/login-scene.png`, ya existe una versión en el artefacto) con `image-rendering: pixelated`, decorativa (`alt=""`), con superposición escalonada para que el texto encima cumpla contraste.
- Se eliminan `fullLogo.svg`, `fullLogo.png`, `logo.svg` y `login-singup.png` tras actualizar todas sus referencias (incluidas historias de Storybook).

### 8. Gráfico y progreso

`BudgetChart` conserva los datos y `Label`; solo cambia el trazo (`stroke` en `--panel`, sin esquinas redondeadas) y la fuente de la etiqueta. `Progress`/`ProgressDiff` usan `.px-bar` y siguen leyendo el color de categoría desde `safeColor`, sin depender del tema.

### 9. Movimiento

Transiciones con `steps()` (ancho de barra lateral, opacidad de etiquetas) envueltas en `motion-safe:`; con `prefers-reduced-motion` no hay animación.

## Risks / Trade-offs

- [Press Start 2P es muy ancha y puede desbordar importes largos o tablas] → Usarla solo en títulos y cifras con tamaños reducidos, mantener `break-all` existente y verificar en 360 px.
- [El tema Nether rojo puede bajar el contraste del texto] → Texto siempre en `--ink` sobre bandas oscuras de la rampa, sombra dura negra en textos sobre degradados y verificación de contraste por tema.
- [Confusión entre rojo del tema Nether y montos negativos/errores] → Montos y errores conservan signo, texto e iconos; el color de peligro es distinto de la rampa Nether.
- [Pruebas que comprueban clases o snapshots antiguos] → Actualizar solo aserciones visuales; las aserciones de roles y nombres accesibles no deben cambiar y sirven de red de seguridad.
- [Reasignar `beige`/`grey` puede producir combinaciones de bajo contraste temporales] → Revisar cada vista en los tres temas antes de dar por terminada la sustitución.

## Migration Plan

- Cambio solo de presentación y una cookie nueva opcional; no hay migración de datos. Sin cookie se usa Overworld.
- Por petición del usuario no se crean commits ni se hace push: los cambios quedan locales para revisión. Revertir es descartar los cambios del árbol de trabajo.
