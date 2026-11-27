# Tasks

Solo se cambia la presentación: no modificar estructura JSX, props, rutas, lógica ni textos accesibles. **No crear commits ni hacer push**; todo queda en el árbol de trabajo para revisión del usuario. Antes de empezar, guardar la salida de `pnpm test` como línea base.

## 1. Tokens, fuentes y utilidades pixel

- [x] 1.1 Definir en `app/globals.css` las variables base y la rampa `--p1..--p4` para `overworld` (por defecto), `[data-theme="nether"]` y `[data-theme="diamond"]`; mapear los tokens shadcn y poner `--radius: 0`. Verificar con una comprobación de contraste (script o tabla en el PR) que texto/fondo cumple 4.5:1 y foco/indicadores 3:1 en los tres temas.
- [x] 1.2 Añadir colores semánticos (`theme-1..4`, `panel`, `line`, `ink`, `ink-muted`, `gold`, `danger`) en `tailwind.config.ts` y reasignar temporalmente `beige`/`grey`/`white` a los nuevos valores sin tocar la `safelist` de categorías. Verificar que `pnpm lint` pasa y que los colores de `lib/finance/colors.ts` no cambian.
- [x] 1.3 Crear las utilidades `.px-frame`, `.px-bevel`, `.px-inset`, `.px-bar` y la regla global `:focus-visible` (3 px dorado, offset 2 px) con `box-shadow` escalonado, sin `clip-path`. Verificar en el navegador que el contorno de foco no queda recortado en botones y campos.
- [x] 1.4 Sustituir `Public Sans` por `Press_Start_2P` (títulos/cifras) y `Pixelify_Sans` (texto) en `app/ui/fonts.ts` y `app/layout.tsx`; reajustar `.text-preset-1..5` con mínimo 14 px para texto de lectura e interlineado 1.4-1.6. Verificar que los importes del resumen y las tablas no desbordan a 360 px.

## 2. Tema seleccionable y persistente

- [x] 2.1 Extender `lib/i18n/preferences.ts` con `theme` validado (`overworld` por defecto) y `cookieNames.theme = 'finance-theme'`; generalizar `savePreference` con lista blanca por preferencia. Añadir pruebas unitarias para valores válidos, inválidos y cookie rechazada, y verificar que las pruebas de idioma existentes siguen pasando.
- [x] 2.2 Leer la cookie en `app/layout.tsx` y escribir `data-theme` en `<html>` desde el servidor. Verificar recargando con cada tema que la primera pintura no parpadea al verde.
- [x] 2.3 Añadir el `Select` de tema en `lib/i18n/PreferencesBar.tsx` con el patrón del de idioma (`label` `sr-only`, `aria-busy`, muestra `aria-hidden`); al cambiar, guardar cookie y actualizar `data-theme` sin `router.refresh()`, revirtiendo y mostrando el toast de error si falla. Añadir mensajes `Theme`, `Overworld`, `Nether`, `Diamond`/`Diamante` en `lib/i18n/messages/en.ts` y `es.ts`. Verificar con una prueba de interacción que se elige por teclado, que se anuncia el nombre traducido y que no se hace ninguna solicitud a la API de finanzas.

## 3. Marca e imágenes propias

- [x] 3.1 Crear `BrandLogo` (texto pixelado `finance` con nombre accesible) y `public/brand/heart.svg`; reemplazar los usos de `fullLogo.svg`/`logo.svg` en `Sidebar`, `MinimizeMenu`, acceso, registro y Storybook, y actualizar favicon, título y descripción en `app/layout.tsx`. Verificar con `grep` que no quedan referencias a los logotipos del reto.
- [x] 3.2 Añadir la escena pixel art de acceso/registro en `public/brand/login-scene.png` (`image-rendering: pixelated`, decorativa) con superposición escalonada para el texto; sustituir `login-singup.png` en `app/login/page.tsx` y `app/singup/page.tsx` conservando el layout. Verificar contraste del titular y que el lector de pantalla no anuncia la imagen.
- [x] 3.3 Eliminar `public/fullLogo.svg`, `fullLogo.png`, `logo.svg` y `login-singup.png`. Verificar que `pnpm test` y Storybook no reportan recursos faltantes.

## 4. Componentes compartidos

- [x] 4.1 Aplicar el estilo a `Sidebar`, `SidebarItem` y `MinimizeMenu` (panel, elemento activo con degradado escalonado del tema, transición `motion-safe` con `steps()`), conservando `aria-current`, `aria-expanded`, el estado minimizado y la barra inferior móvil. Verificar las historias `SideBar`/`SideBarItem`/`MinimizeMenu` y la navegación por teclado.
- [x] 4.2 Aplicar `.px-bevel`/`.px-inset`/`.px-frame` a `button`, `input`, `InputPassword`, `InputSearch`, `select`, `ResponsiveSelect`, `dropdown-menu`, `dialog`, `pagination`, `calendar`, `skeleton` y `Notifications`. Verificar las historias de Storybook de cada uno y que sus pruebas de roles y nombres siguen pasando.
- [x] 4.3 Cambiar `Progress` y `ProgressDiff` a barras segmentadas `.px-bar` con el color de categoría vía `safeColor`, y ajustar `BudgetChart` (trazo y fuente) sin cambiar datos ni etiqueta. Verificar `ProgressDiff.stories` y que porcentajes y valores accesibles no cambian.

## 5. Vistas

- [x] 5.1 Resumen (`app/ui/overview/*`): las tres tarjetas superiores con estilo pixel y la de balance con el degradado del tema; sin caja de diálogo ni corazón grande. Verificar en escritorio y a 375 px que el orden y la retícula son los actuales.
- [x] 5.2 Sustituir clases visuales de transacciones, categorías, presupuestos, apartados y pagos recurrentes por las semánticas, sin tocar estructura. Verificar cada vista en los tres temas a 375, 768 y 1440 px.
- [x] 5.3 Retirar los alias temporales `beige`/`grey` de `tailwind.config.ts` cuando no queden usos. Verificar con `grep` que no hay referencias y que `pnpm lint` pasa.

## 6. Verificación integral

- [x] 6.1 Ejecutar `pnpm test`, `pnpm lint` y `pnpm test:e2e`; actualizar solo aserciones/snapshots puramente visuales y confirmar contra la línea base que ninguna aserción de accesibilidad cambió.
- [ ] 6.2 Recorrer las siete vistas con teclado en cada tema y con `prefers-reduced-motion: reduce`, comprobando foco visible, ausencia de animaciones y conservación de filtros, página y sesión al cambiar de tema.
- [x] 6.3 Revisar `git status` y dejar los cambios sin commit ni push para que el usuario los revise.
