# Proposal

> Sustituida por [keep-language-only-preferences](../keep-language-only-preferences/proposal.md). La localización se conserva; la selección USD/MXN y sus requisitos se descartaron. Este documento queda como historial: no sincronizar sus deltas monetarios ni usarlos como alcance vigente.

## Why

La aplicación muestra su interfaz únicamente en inglés y fija el formato monetario en USD, aunque el usuario quiera trabajar visualmente en español o con pesos mexicanos. Se necesitan preferencias globales de presentación que no alteren los importes ni requieran un backend de negocio.

## What Changes

- Agregar inglés y español a toda la interfaz de producto, incluidos navegación, formularios, diálogos, filtros, estados vacíos y textos accesibles. Inglés continúa como idioma inicial.
- Permitir elegir USD o MXN para presentar todos los importes de la demo, independientemente del idioma. USD sigue siendo el valor inicial.
- Persistir ambas preferencias en cookies del navegador y leerlas durante el renderizado de Next.js, para que la primera respuesta ya use el idioma y formato elegidos.
- Centralizar traducciones y formato nativo con `Intl`, reemplazando importes y fechas de presentación escritos como cadenas. Mantener los mismos valores numéricos, cálculos y fechas.
- Separar etiquetas traducidas de los valores internos de categorías, ordenación, estados y parámetros de URL.
- Mostrar en las preferencias que seleccionar otra moneda cambia la presentación y no convierte los importes.
- Mantener las rutas actuales. No agregar tipos de cambio, cuentas multimoneda, sincronización de perfil, endpoints de negocio ni dependencias de internacionalización.

## Capabilities

### New Capabilities

- `localization`: Traducción consistente de la interfaz y formato localizado de fechas y números, preservando identificadores y contenido del usuario.
- `display-preferences`: Selección global e independiente de idioma y moneda, persistencia por navegador, inicialización coherente entre servidor y cliente y presentación monetaria sin conversión.

### Modified Capabilities

Ninguna. El proyecto no tiene especificaciones principales existentes.

## Impact

- `app/layout.tsx`, layouts y páginas de finanzas, acceso y registro: preferencias iniciales, controles comunes, `<html lang>` y textos localizados.
- `lib/utils.ts`, utilidades de transacciones y todos sus consumidores: sustituir el formateador USD global por formateadores que reciben preferencias explícitas.
- `app/ui/**` y `components/ui/**`: traducciones, importes numéricos, etiquetas de fechas y separación entre valores y etiquetas de selectores.
- Pruebas de Vitest y Playwright, más el contexto de Storybook para componentes compartidos.
- Leer cookies hará que estas rutas usen renderizado por solicitud; no se añadirán prefijos de idioma ni se migrarán las rutas.
- Sin cambios de backend ni base de datos. En una futura integración con dinero real, la moneda base deberá formar parte de los datos de la cuenta: no será correcto rotular USD como MXN sin conversión.
