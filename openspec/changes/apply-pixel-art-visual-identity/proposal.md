# Proposal

## Why

La interfaz actual reproduce la identidad visual del reto de Frontend Mentor (paleta beige/gris, Public Sans, ilustración y logotipos del reto). La aplicación ya tiene funciones propias (categorías, modo invitado, idioma, actualizaciones optimistas), y el usuario quiere compartirla como un proyecto personal con una identidad propia, retro, de pixel art inspirada en Minecraft y Undertale, aprobada en la propuesta visual `finance-pixel`.

## What Changes

- Sustituir la identidad visual completa (colores, tipografía, bordes, sombras, iconografía de marca e imágenes) por un estilo pixel art: esquinas escalonadas, biseles tipo bloque, sombras duras sin desenfoque, barras de progreso segmentadas y tipografías pixeladas (`Press Start 2P` para títulos y cifras, `Pixelify Sans` para el texto).
- Conservar el layout actual sin cambios estructurales: misma barra lateral expandible/minimizable en escritorio, misma barra de navegación inferior en móvil y tableta, mismo orden y retícula de secciones en las siete vistas, mismas rutas y mismos componentes funcionales. El cambio es solo de identidad.
- Añadir tres temas de color con degradados escalonados por bloques: **Overworld** (verde, predeterminado), **Nether** (rojo) y **Diamante** (azul). El tema se elige con un selector accesible junto al selector de idioma y persiste por navegador, igual que el idioma.
- Mantener el nombre de la aplicación como `finance`, con un logotipo nuevo en texto pixelado y un icono propio de corazón pixelado para la versión minimizada; retirar `fullLogo.svg`, `fullLogo.png`, `logo.svg` y `login-singup.png` del reto.
- Reemplazar la ilustración de acceso y registro por una escena pixel art propia (paisaje de bloques nocturno con un cofre de monedas).
- En el resumen, mostrar solo las tres tarjetas (balance actual, ingresos, gastos) con el nuevo estilo. No se añade la caja de diálogo con el corazón grande que aparecía en la propuesta visual.
- Preservar todos los elementos de accesibilidad existentes: etiquetas `aria-*`, `aria-current`, `aria-expanded`, textos `sr-only`, nombres accesibles traducidos, roles de notificación, áreas táctiles mínimas de 44 px, uso por teclado y foco visible. El foco visible pasa a un contorno de 3 px de alto contraste coherente con el tema, y todas las combinaciones de texto cumplen WCAG AA en los tres temas.
- Respetar `prefers-reduced-motion` en las animaciones escalonadas nuevas.
- No crear commits ni hacer push durante la implementación: el usuario revisará los cambios locales antes de confirmarlos.

## Capabilities

### New Capabilities

- `visual-identity`: lenguaje visual pixel art de la aplicación (tipografía, superficies, bordes, sombras, progreso, gráficos), marca `finance`, imágenes propias, conservación del layout y de la accesibilidad existente.
- `color-themes`: catálogo de los temas Overworld, Nether y Diamante, selección accesible, persistencia por navegador y renderizado coherente entre servidor y cliente.

### Modified Capabilities

<!-- No hay specs principales en openspec/specs; no se modifican capacidades existentes. -->

## Impact

- **Estilos y configuración**: `app/globals.css` (tokens shadcn y presets de texto), `tailwind.config.ts` (colores `beige`/`grey`, radios), `app/ui/fonts.ts` y `app/layout.tsx` (fuentes, clase de tema en `<html>`, metadatos `finance`).
- **Componentes compartidos**: `components/ui/Sidebar.tsx`, `SidebarItem.tsx`, `MinimizeMenu.tsx`, `button.tsx`, `input.tsx`, `select.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `Progress.tsx`, `ProgressDiff.tsx`, `pagination.tsx`, `skeleton.tsx`, `calendar.tsx`, `Notifications.tsx`, `chart.tsx`.
- **Vistas**: `app/login/page.tsx`, `app/singup/page.tsx`, `app/ui/overview/*`, y las superficies de tarjetas de transacciones, categorías, presupuestos, apartados y pagos recurrentes (solo clases visuales).
- **Preferencias**: `lib/i18n/PreferencesBar.tsx`, `lib/i18n/preferences.ts`, `lib/i18n/cookie.ts` y `lib/i18n/server.ts` para leer y guardar la cookie de tema; mensajes nuevos en `lib/i18n/messages/en.ts` y `es.ts`.
- **Recursos**: nuevas imágenes en `public/` y eliminación de los recursos del reto.
- **Pruebas y Storybook**: pruebas unitarias del tema y la cookie, actualización de snapshots/aserciones visuales que dependan de clases antiguas, e historias de Storybook con selector de tema.
- **Dependencias**: ninguna nueva; las fuentes se cargan con `next/font/google`.
